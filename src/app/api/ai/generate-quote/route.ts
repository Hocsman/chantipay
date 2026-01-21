import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { QuoteItemInput } from '@/types/quote'
import type { QuoteAgentType } from '@/lib/ai/quoteAgents'
import { withAISecurity, type AIRequestContext } from '@/lib/security/aiMiddleware'
import { getFromCache, setInCache, generateCacheKey } from '@/lib/redis'

// ===========================================
// Agent Definitions
// ===========================================
const quoteAgentValues = ['auto', 'quick', 'advice', 'compliance', 'upsell'] as const
type ResolvedQuoteAgent = Exclude<QuoteAgentType, 'auto'>
const QUOTE_AGENT_VALUE_SET = new Set<QuoteAgentType>(quoteAgentValues)

function isQuoteAgent(value: unknown): value is QuoteAgentType {
  return typeof value === 'string' && QUOTE_AGENT_VALUE_SET.has(value as QuoteAgentType)
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const COMPLIANCE_KEYWORDS = [
  'conformite',
  'norme',
  'mise aux normes',
  'nf c 15-100',
  'dtu',
  'reglement',
  'securite',
  'consuel',
  'attestation',
  'controle',
]

const ADVICE_KEYWORDS = [
  'conseil',
  'recommand',
  'optimisation',
  'diagnostic',
  'audit',
  'preconisation',
  'etude',
  'dimensionnement',
]

const UPSELL_KEYWORDS = [
  'option',
  'optionnel',
  'supplement',
  'upgrade',
  'entretien',
  'maintenance',
  'contrat',
  'garantie',
  'premium',
  'service additionnel',
  'pack',
]

const QUICK_KEYWORDS = [
  'rapide',
  'express',
  'urgent',
  'depannage',
  'simple',
]

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function detectAgentFromDescription(description: string): ResolvedQuoteAgent {
  const normalized = normalizeText(description)

  if (includesKeyword(normalized, COMPLIANCE_KEYWORDS)) return 'compliance'
  if (includesKeyword(normalized, ADVICE_KEYWORDS)) return 'advice'
  if (includesKeyword(normalized, UPSELL_KEYWORDS)) return 'upsell'
  if (includesKeyword(normalized, QUICK_KEYWORDS)) return 'quick'

  return 'quick'
}

function resolveAgent(
  requestedAgent: QuoteAgentType | undefined,
  description: string
): ResolvedQuoteAgent {
  if (!requestedAgent || requestedAgent === 'auto') {
    return detectAgentFromDescription(description)
  }

  return requestedAgent
}

// ===========================================
// Input Validation Schema
// ===========================================
const generateQuoteInputSchema = z.object({
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  trade: z.string().optional(),
  vat_rate: z.number().min(0).max(30).optional(),
  agent: z.enum(quoteAgentValues).optional(),
})

type GenerateQuoteInput = z.infer<typeof generateQuoteInputSchema>

// ===========================================
// Output Validation Schema
// ===========================================
const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description requise').max(500),
  quantity: z.number().min(1).max(100),
  unit_price_ht: z.number().min(1).max(100000),
  vat_rate: z.number().min(0).max(30),
})

const aiOutputSchema = z.object({
  items: z.array(quoteItemSchema).min(1).max(10),
})

// ===========================================
// System Prompt for OpenAI
// ===========================================
const BASE_SYSTEM_PROMPT = `Tu es un assistant spécialisé pour les artisans français (plombiers, électriciens, maçons, peintres, menuisiers, etc.).
Ta tâche est de générer des lignes de devis professionnelles à partir d'une description de travaux.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte additionnel
2. Le format de réponse est: { "items": [...] }
3. Maximum 10 lignes
4. Sépare main d'œuvre et fournitures quand pertinent
5. Inclus le déplacement si mentionné
6. Prix réalistes pour le marché français actuel
7. Descriptions courtes et professionnelles en français

SCHÉMA EXACT pour chaque item:
{
  "description": "string (description courte en français)",
  "quantity": number (1-100),
  "unit_price_ht": number (prix unitaire HT en euros, 1-100000),
  "vat_rate": number (taux TVA: 5.5, 10, ou 20)
}

TVA applicable:
- 10% pour travaux de rénovation dans logements > 2 ans
- 20% pour construction neuve ou matériel seul
- 5.5% pour travaux d'amélioration énergétique

EXEMPLE de réponse valide:
{
  "items": [
    { "description": "Fourniture robinet mitigeur cuisine", "quantity": 1, "unit_price_ht": 85, "vat_rate": 20 },
    { "description": "Dépose ancien robinet", "quantity": 1, "unit_price_ht": 25, "vat_rate": 10 },
    { "description": "Pose et raccordement robinet", "quantity": 1, "unit_price_ht": 45, "vat_rate": 10 },
    { "description": "Frais de déplacement", "quantity": 1, "unit_price_ht": 35, "vat_rate": 20 }
  ]
}`

const AGENT_PROMPTS: Record<ResolvedQuoteAgent, string> = {
  quick: `MODE "Devis rapide":
- Priorise les postes essentiels uniquement
- 3 à 6 lignes maximum si possible
- Pas de recommandations optionnelles`,
  advice: `MODE "Conseil technique":
- Ajoute 1 à 2 lignes d'étude/diagnostic ou d'optimisation technique si pertinent
- Reste concis et professionnel`,
  compliance: `MODE "Conformité & réglementation":
- Ajoute 1 à 2 lignes dédiées aux contrôles/tests de conformité
- Mentionne la norme pertinente si possible (NF C 15-100, DTU)`,
  upsell: `MODE "Upsell":
- Ajoute 1 à 3 lignes optionnelles préfixées par "Option:"
- Propose des services additionnels (entretien, garantie, finitions)`,
}

function buildSystemPrompt(agent: ResolvedQuoteAgent): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${AGENT_PROMPTS[agent]}`.trim()
}

// ===========================================
// Fallback Generator
// ===========================================
function generateFallbackItems(
  description: string,
  trade?: string,
  defaultVatRate = 20,
  agent: ResolvedQuoteAgent = 'quick'
): QuoteItemInput[] {
  const vatRate = defaultVatRate
  const lowerDesc = description.toLowerCase()
  const lowerTrade = trade?.toLowerCase() || ''

  // Detect trade from description or trade parameter
  const isPlumbing = lowerTrade.includes('plomb') || lowerDesc.includes('plomb') || lowerDesc.includes('eau') || lowerDesc.includes('robinet') || lowerDesc.includes('wc') || lowerDesc.includes('chauffe')
  const isElectric = lowerTrade.includes('élec') || lowerDesc.includes('élec') || lowerDesc.includes('prise') || lowerDesc.includes('tableau') || lowerDesc.includes('câbl')
  const isPainting = lowerTrade.includes('peint') || lowerDesc.includes('peint') || lowerDesc.includes('enduit') || lowerDesc.includes('mur')
  const isCarpentry = lowerTrade.includes('menuis') || lowerDesc.includes('porte') || lowerDesc.includes('fenêtre') || lowerDesc.includes('bois')

  // Check for common extras
  const includesTravel = lowerDesc.includes('déplacement') || lowerDesc.includes('deplacement')
  const includesMaterial = lowerDesc.includes('fourniture') || lowerDesc.includes('matéri')
  const isUrgent = lowerDesc.includes('urgent') || lowerDesc.includes('majoration')

  const items: QuoteItemInput[] = []

  if (isPlumbing) {
    items.push(
      { description: 'Fourniture matériel plomberie', quantity: 1, unit_price_ht: 120, vat_rate: vatRate },
      { description: 'Main d\'œuvre plomberie', quantity: 2, unit_price_ht: 45, vat_rate: 10 },
      { description: 'Raccordements et mise en service', quantity: 1, unit_price_ht: 35, vat_rate: 10 }
    )
  } else if (isElectric) {
    items.push(
      { description: 'Fourniture matériel électrique', quantity: 1, unit_price_ht: 150, vat_rate: vatRate },
      { description: 'Main d\'œuvre électricité', quantity: 3, unit_price_ht: 50, vat_rate: 10 },
      { description: 'Mise en conformité et tests', quantity: 1, unit_price_ht: 40, vat_rate: 10 }
    )
  } else if (isPainting) {
    items.push(
      { description: 'Fourniture peinture et enduits', quantity: 1, unit_price_ht: 80, vat_rate: vatRate },
      { description: 'Préparation des surfaces', quantity: 1, unit_price_ht: 60, vat_rate: 10 },
      { description: 'Application peinture (2 couches)', quantity: 1, unit_price_ht: 120, vat_rate: 10 }
    )
  } else if (isCarpentry) {
    items.push(
      { description: 'Fourniture menuiserie', quantity: 1, unit_price_ht: 200, vat_rate: vatRate },
      { description: 'Dépose anciens éléments', quantity: 1, unit_price_ht: 50, vat_rate: 10 },
      { description: 'Pose et ajustements', quantity: 2, unit_price_ht: 55, vat_rate: 10 }
    )
  } else {
    // Generic fallback
    items.push(
      { description: 'Fourniture matériaux', quantity: 1, unit_price_ht: 100, vat_rate: vatRate },
      { description: 'Main d\'œuvre', quantity: 2, unit_price_ht: 45, vat_rate: 10 },
      { description: 'Finitions et nettoyage', quantity: 1, unit_price_ht: 30, vat_rate: 10 }
    )
  }

  // Add travel if mentioned
  if (includesTravel || includesMaterial) {
    items.push({ description: 'Frais de déplacement', quantity: 1, unit_price_ht: 35, vat_rate: 20 })
  }

  // Add urgency surcharge if mentioned
  if (isUrgent) {
    items.push({ description: 'Majoration intervention urgente', quantity: 1, unit_price_ht: 50, vat_rate: 20 })
  }

  return applyAgentFallbackAdjustments(items, agent, trade, vatRate)
}

function applyAgentFallbackAdjustments(
  items: QuoteItemInput[],
  agent: ResolvedQuoteAgent,
  trade?: string,
  defaultVatRate = 20
): QuoteItemInput[] {
  if (agent === 'quick') {
    return items
  }

  const normalizedDescriptions = items.map((item) => normalizeText(item.description))
  const addItem = (item: QuoteItemInput, keywords: string[]) => {
    if (items.length >= 10) return
    if (keywords.some((keyword) => normalizedDescriptions.some((desc) => desc.includes(keyword)))) return
    items.push(item)
    normalizedDescriptions.push(normalizeText(item.description))
  }

  const tradeKey = trade ? normalizeText(trade) : ''

  if (agent === 'advice') {
    addItem(
      {
        description: 'Conseil technique et préconisations',
        quantity: 1,
        unit_price_ht: 45,
        vat_rate: 10,
      },
      ['conseil', 'diagnostic', 'etude', 'preconisation']
    )
  }

  if (agent === 'compliance') {
    const complianceItem: QuoteItemInput = (() => {
      if (tradeKey.includes('electric')) {
        return {
          description: 'Contrôle conformité NF C 15-100',
          quantity: 1,
          unit_price_ht: 75,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('plomb')) {
        return {
          description: 'Essais d\'étanchéité et conformité DTU',
          quantity: 1,
          unit_price_ht: 60,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('menuis')) {
        return {
          description: 'Vérification conformité DTU menuiseries',
          quantity: 1,
          unit_price_ht: 70,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('peint')) {
        return {
          description: 'Contrôle préparation support (DTU)',
          quantity: 1,
          unit_price_ht: 50,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('renov')) {
        return {
          description: 'Vérification conformité DTU',
          quantity: 1,
          unit_price_ht: 60,
          vat_rate: 10,
        }
      }
      return {
        description: 'Vérification conformité et tests',
        quantity: 1,
        unit_price_ht: 60,
        vat_rate: 10,
      }
    })()

    addItem(
      complianceItem,
      ['conformite', 'norme', 'test', 'controle', 'dtu', 'nf c 15-100']
    )
  }

  if (agent === 'upsell') {
    const upsellItem: QuoteItemInput = (() => {
      if (tradeKey.includes('electric')) {
        return {
          description: 'Option: Parafoudre de tableau',
          quantity: 1,
          unit_price_ht: 120,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('plomb')) {
        return {
          description: 'Option: Contrat d\'entretien annuel',
          quantity: 1,
          unit_price_ht: 120,
          vat_rate: 20,
        }
      }
      if (tradeKey.includes('peint')) {
        return {
          description: 'Option: Peinture plafond (forfait)',
          quantity: 1,
          unit_price_ht: 150,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('menuis')) {
        return {
          description: 'Option: Traitement du bois',
          quantity: 1,
          unit_price_ht: 80,
          vat_rate: 10,
        }
      }
      if (tradeKey.includes('renov')) {
        return {
          description: 'Option: Nettoyage de fin de chantier',
          quantity: 1,
          unit_price_ht: 150,
          vat_rate: 20,
        }
      }
      return {
        description: 'Option: Nettoyage de fin de chantier',
        quantity: 1,
        unit_price_ht: 150,
        vat_rate: defaultVatRate,
      }
    })()

    addItem(
      upsellItem,
      ['option', 'entretien', 'garantie', 'parafoudre', 'nettoyage', 'traitement']
    )
  }

  return items
}

// ===========================================
// OpenAI API Call
// ===========================================
async function callOpenAI(
  description: string,
  trade: string | undefined,
  vatRate: number | undefined,
  agent: ResolvedQuoteAgent
): Promise<QuoteItemInput[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const userPrompt = [
    trade ? `Métier: ${trade}` : '',
    vatRate ? `Taux TVA par défaut: ${vatRate}%` : '',
    '',
    'Description des travaux:',
    description,
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
        { role: 'system', content: buildSystemPrompt(agent) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
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

  // Parse and validate the response
  const parsed = JSON.parse(content)
  
  // Handle both { items: [...] } and direct array format
  const itemsArray = parsed.items || parsed
  if (!Array.isArray(itemsArray)) {
    throw new Error('Invalid response format: expected items array')
  }

  // Validate with zod
  const validated = aiOutputSchema.parse({ items: itemsArray })
  return validated.items
}

// ===========================================
// API Route Handler
// ===========================================
async function handleGenerateQuote(
  _request: NextRequest,
  context: AIRequestContext,
  body: GenerateQuoteInput
): Promise<NextResponse> {
  // Validation Zod
  const validationResult = generateQuoteInputSchema.safeParse(body)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(e => e.message).join(', ')
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  const { description, trade, vat_rate, agent } = validationResult.data
  const resolvedAgent = resolveAgent(agent, description)

  // Générer une clé de cache
  const cacheKey = generateCacheKey({
    description: description.toLowerCase().trim(),
    trade,
    vat_rate,
    agent: resolvedAgent,
  })

  // Vérifier le cache (1h de TTL)
  const cached = await getFromCache<{ items: QuoteItemInput[]; agent: string }>('aiResponse', `quote:${cacheKey}`)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  let items: QuoteItemInput[]

  try {
    items = await callOpenAI(description, trade, vat_rate, resolvedAgent)

    // Mettre en cache pour 1 heure
    await setInCache('aiResponse', `quote:${cacheKey}`, { items, agent: resolvedAgent }, 3600)
  } catch (error) {
    console.warn('OpenAI call failed, using fallback:', error)
    items = generateFallbackItems(description, trade, vat_rate ?? 20, resolvedAgent)
  }

  // Log pour analytics
  if (context.user) {
    console.log(`[AI:Quote] User ${context.user.id} generated quote, agent: ${resolvedAgent}, trade: ${trade || 'none'}`)
  }

  return NextResponse.json({ items, agent: resolvedAgent })
}

// Export avec le wrapper de sécurité
export const POST = withAISecurity<GenerateQuoteInput>(
  {
    action: 'ai:generate-quote',
    requireAuth: false,
    allowAnonymous: true,
  },
  handleGenerateQuote
)
