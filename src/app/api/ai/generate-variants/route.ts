import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAISecurity, type AIRequestContext } from '@/lib/security/aiMiddleware'
import { getFromCache, setInCache, generateCacheKey } from '@/lib/redis'

// ===========================================
// Input Validation Schema
// ===========================================
const quoteItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number(),
  unit_price_ht: z.number(),
  vat_rate: z.number(),
})

const generateVariantsInputSchema = z.object({
  baseItems: z.array(quoteItemSchema).min(1, 'Au moins une ligne de devis requise'),
  trade: z.string().optional(),
  context: z.string().max(500).optional(),
})

type GenerateVariantsInput = z.infer<typeof generateVariantsInputSchema>

// ===========================================
// Output Schema
// ===========================================
interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface QuoteVariant {
  tier: 'eco' | 'standard' | 'premium'
  name: string
  description: string
  items: QuoteItem[]
  totalHT: number
  highlights: string[]
}

interface GenerateVariantsResult {
  variants: QuoteVariant[]
  explanation?: string
}

// ===========================================
// System Prompt for Variant Generation
// ===========================================
const SYSTEM_PROMPT = `Tu es un expert en estimation de travaux pour artisans français.
Tu génères 3 versions de devis à partir d'un devis de base: Éco, Standard et Premium.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte additionnel
2. Conserve le même type de travaux mais adapte la qualité et les options
3. Les prix doivent être réalistes pour le marché français
4. Chaque version doit avoir une cohérence interne
5. Le devis Éco doit être 20-30% moins cher que le Standard
6. Le devis Premium doit être 30-50% plus cher que le Standard

VERSION ÉCO:
- Matériaux entrée de gamme mais fonctionnels
- Pas de finitions premium
- Main d'œuvre optimisée
- Garantie minimale légale

VERSION STANDARD (base fournie):
- Matériaux milieu de gamme, bon rapport qualité/prix
- Finitions soignées
- Délais normaux
- Garantie standard

VERSION PREMIUM:
- Matériaux haut de gamme, marques reconnues
- Finitions impeccables
- Options et accessoires supplémentaires
- Garanties étendues
- Service après-vente prioritaire

FORMAT DE RÉPONSE:
{
  "variants": [
    {
      "tier": "eco",
      "name": "Version Économique",
      "description": "Solution fonctionnelle et économique",
      "items": [
        {
          "id": "eco-1",
          "description": "Description du produit/service",
          "quantity": 1,
          "unit_price_ht": 100,
          "vat_rate": 10
        }
      ],
      "totalHT": 100,
      "highlights": ["Point fort 1", "Point fort 2"]
    },
    {
      "tier": "standard",
      "name": "Version Standard",
      "description": "Meilleur rapport qualité/prix",
      "items": [...],
      "totalHT": 150,
      "highlights": ["Point fort 1", "Point fort 2"]
    },
    {
      "tier": "premium",
      "name": "Version Premium",
      "description": "Qualité et finitions haut de gamme",
      "items": [...],
      "totalHT": 220,
      "highlights": ["Point fort 1", "Point fort 2"]
    }
  ],
  "explanation": "Explication des différences entre les versions"
}

TVA applicable:
- 10% pour travaux de rénovation dans logements > 2 ans
- 20% pour construction neuve ou matériel seul
- 5.5% pour travaux d'amélioration énergétique

IMPORTANT:
- Génère TOUJOURS exactement 3 versions
- Les IDs doivent être uniques (eco-1, eco-2, std-1, std-2, prem-1, etc.)
- Calcule correctement les totaux HT
- Les highlights doivent être des avantages concrets et distincts`

// ===========================================
// OpenAI API Call
// ===========================================
async function callOpenAI(
  baseItems: QuoteItem[],
  trade?: string,
  context?: string
): Promise<GenerateVariantsResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const baseTotal = baseItems.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)

  const userPrompt = [
    trade ? `Métier de l'artisan: ${trade}` : '',
    context ? `Contexte: ${context}` : '',
    '',
    'Devis de base à transformer en 3 versions (Éco, Standard, Premium):',
    '',
    ...baseItems.map((item, i) =>
      `${i + 1}. ${item.description} - Qté: ${item.quantity} - Prix unitaire HT: ${item.unit_price_ht}€ - TVA: ${item.vat_rate}%`
    ),
    '',
    `Total HT actuel: ${baseTotal.toFixed(2)}€`,
    '',
    'Génère les 3 versions en gardant la cohérence avec le type de travaux.',
  ].filter(Boolean).join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  const parsed = JSON.parse(content)

  // Validate structure
  if (!Array.isArray(parsed.variants) || parsed.variants.length !== 3) {
    throw new Error('Invalid response: expected exactly 3 variants')
  }

  // Recalculate totals to ensure accuracy
  for (const variant of parsed.variants) {
    variant.totalHT = variant.items.reduce(
      (sum: number, item: QuoteItem) => sum + item.quantity * item.unit_price_ht,
      0
    )
  }

  return parsed as GenerateVariantsResult
}

// ===========================================
// Fallback Generation (without API)
// ===========================================
function generateFallback(baseItems: QuoteItem[]): GenerateVariantsResult {
  const baseTotal = baseItems.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)

  // Éco: -25%
  const ecoItems: QuoteItem[] = baseItems.map((item, i) => ({
    id: `eco-${i + 1}`,
    description: item.description.replace(/premium|haut de gamme|luxe/gi, 'standard').replace(/standard/gi, 'économique'),
    quantity: item.quantity,
    unit_price_ht: Math.round(item.unit_price_ht * 0.75 * 100) / 100,
    vat_rate: item.vat_rate,
  }))

  // Standard: base
  const standardItems: QuoteItem[] = baseItems.map((item, i) => ({
    id: `std-${i + 1}`,
    description: item.description,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    vat_rate: item.vat_rate,
  }))

  // Premium: +40%
  const premiumItems: QuoteItem[] = baseItems.map((item, i) => ({
    id: `prem-${i + 1}`,
    description: item.description.replace(/économique|basique|entrée de gamme/gi, 'standard').replace(/standard/gi, 'haut de gamme'),
    quantity: item.quantity,
    unit_price_ht: Math.round(item.unit_price_ht * 1.4 * 100) / 100,
    vat_rate: item.vat_rate,
  }))

  const ecoTotal = ecoItems.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)
  const premiumTotal = premiumItems.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)

  return {
    variants: [
      {
        tier: 'eco',
        name: 'Version Économique',
        description: 'Solution fonctionnelle et économique',
        items: ecoItems,
        totalHT: Math.round(ecoTotal * 100) / 100,
        highlights: [
          'Prix optimisé',
          'Matériaux fonctionnels',
          'Rapport qualité/prix',
        ],
      },
      {
        tier: 'standard',
        name: 'Version Standard',
        description: 'Meilleur rapport qualité/prix',
        items: standardItems,
        totalHT: Math.round(baseTotal * 100) / 100,
        highlights: [
          'Qualité professionnelle',
          'Matériaux durables',
          'Garantie standard',
        ],
      },
      {
        tier: 'premium',
        name: 'Version Premium',
        description: 'Qualité et finitions haut de gamme',
        items: premiumItems,
        totalHT: Math.round(premiumTotal * 100) / 100,
        highlights: [
          'Matériaux haut de gamme',
          'Finitions premium',
          'Garantie étendue',
        ],
      },
    ],
    explanation: 'Trois versions générées avec différents niveaux de gamme.',
  }
}

// ===========================================
// API Route Handler
// ===========================================
async function handleGenerateVariants(
  _request: NextRequest,
  reqContext: AIRequestContext,
  input: GenerateVariantsInput
): Promise<NextResponse> {
  // Validate input
  const validationResult = generateVariantsInputSchema.safeParse(input)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(e => e.message).join(', ')
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  const { baseItems, trade, context } = validationResult.data

  // Check cache first
  const cacheKey = generateCacheKey({ prefix: 'generate-variants', baseItems, trade, context })
  const cached = await getFromCache<GenerateVariantsResult>('aiResponse', cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true })
  }

  let result: GenerateVariantsResult

  try {
    // Try OpenAI API first
    result = await callOpenAI(baseItems, trade, context)
  } catch (error) {
    console.warn('OpenAI call failed, using fallback:', error)
    // Fallback to simple generation
    result = generateFallback(baseItems)
  }

  // Cache successful result (10 minutes)
  await setInCache('aiResponse', cacheKey, result, 600)

  // Log pour analytics
  if (reqContext.user) {
    console.log(`[AI:Variants] User ${reqContext.user.id} generated variants, trade: ${trade || 'none'}`)
  }

  return NextResponse.json(result)
}

export const POST = withAISecurity<GenerateVariantsInput>(
  {
    action: 'ai:generate-variants',
    requireAuth: false,
    allowAnonymous: true,
  },
  handleGenerateVariants
)
