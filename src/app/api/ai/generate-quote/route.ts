import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { QuoteItemInput } from '@/types/quote'

// ===========================================
// Rate Limiting (Best-effort in-memory)
// ===========================================
// TODO: For production, use Upstash Redis or similar for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, 60 * 1000) // Every minute

// ===========================================
// Input Validation Schema
// ===========================================
const generateQuoteInputSchema = z.object({
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
  trade: z.string().optional(),
  vat_rate: z.number().min(0).max(30).optional(),
})

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
const SYSTEM_PROMPT = `Tu es un assistant spécialisé pour les artisans français (plombiers, électriciens, maçons, peintres, menuisiers, etc.).
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

// ===========================================
// Fallback Generator
// ===========================================
function generateFallbackItems(description: string, trade?: string, defaultVatRate = 20): QuoteItemInput[] {
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

  return items
}

// ===========================================
// OpenAI API Call
// ===========================================
async function callOpenAI(description: string, trade?: string, vatRate?: number): Promise<QuoteItemInput[]> {
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
        { role: 'system', content: SYSTEM_PROMPT },
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
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter quelques minutes.' },
        { 
          status: 429,
          headers: { 'X-RateLimit-Remaining': '0' }
        }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const validationResult = generateQuoteInputSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => e.message).join(', ')
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      )
    }

    const { description, trade, vat_rate } = validationResult.data

    let items: QuoteItemInput[]

    try {
      // Try OpenAI first
      items = await callOpenAI(description, trade, vat_rate)
    } catch (error) {
      console.warn('OpenAI call failed, using fallback:', error)
      // Fallback to heuristic generation
      items = generateFallbackItems(description, trade, vat_rate ?? 20)
    }

    return NextResponse.json(
      { items },
      { 
        headers: { 'X-RateLimit-Remaining': remaining.toString() }
      }
    )

  } catch (error) {
    console.error('❌ Erreur génération IA:', error)
    
    // Try to return fallback even on unexpected errors
    try {
      const body = await request.clone().json().catch(() => ({}))
      const fallbackItems = generateFallbackItems(
        body.description || 'Travaux généraux',
        body.trade,
        body.vat_rate ?? 20
      )
      return NextResponse.json({ items: fallbackItems })
    } catch {
      return NextResponse.json(
        { error: 'Erreur lors de la génération du devis' },
        { status: 500 }
      )
    }
  }
}
