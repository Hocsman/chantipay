import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ===========================================
// Rate Limiting (Best-effort in-memory)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 15 // 15 requests per window

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
}, 60 * 1000)

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

const smartEditInputSchema = z.object({
  instruction: z.string()
    .min(5, 'L\'instruction doit contenir au moins 5 caractères')
    .max(500, 'L\'instruction ne peut pas dépasser 500 caractères'),
  currentItems: z.array(quoteItemSchema).min(1, 'Le devis doit contenir au moins une ligne'),
})

// ===========================================
// Output Validation Schema
// ===========================================
const outputItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0).max(1000),
  unit_price_ht: z.number().min(0).max(100000),
  vat_rate: z.number().min(0).max(30),
  _action: z.enum(['keep', 'modify', 'delete', 'add']).optional(),
})

const aiOutputSchema = z.object({
  items: z.array(outputItemSchema),
  explanation: z.string().optional(),
})

// ===========================================
// System Prompt for Smart Edit
// ===========================================
const SYSTEM_PROMPT = `Tu es un assistant spécialisé pour les artisans français.
Ta tâche est de MODIFIER un devis existant selon les instructions en langage naturel.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte additionnel
2. Le format de réponse est: { "items": [...], "explanation": "..." }
3. Conserve les IDs existants pour les lignes modifiées ou inchangées
4. Pour les nouvelles lignes, utilise un ID format "new-{timestamp}-{index}"
5. Prix réalistes pour le marché français
6. Descriptions courtes et professionnelles en français

TYPES D'INSTRUCTIONS POSSIBLES:
- Remplacer un élément: "Remplace le robinet par un mitigeur thermostatique"
- Ajouter une ligne: "Ajoute une ligne pour la protection du chantier"
- Modifier les quantités: "Augmente les quantités de peinture de 20%"
- Modifier les prix: "Applique une remise de 10% sur la main d'œuvre"
- Supprimer une ligne: "Supprime la ligne de déplacement"
- Modifier la TVA: "Passe la TVA à 5.5% pour les travaux d'isolation"

SCHÉMA EXACT pour chaque item:
{
  "id": "string (ID existant ou nouveau format new-timestamp-index)",
  "description": "string",
  "quantity": number,
  "unit_price_ht": number (prix unitaire HT en euros),
  "vat_rate": number (5.5, 10, ou 20),
  "_action": "keep" | "modify" | "delete" | "add" (optionnel, pour info)
}

EXEMPLE de réponse valide:
{
  "items": [
    { "id": "existing-id-1", "description": "Fourniture mitigeur thermostatique", "quantity": 1, "unit_price_ht": 150, "vat_rate": 20, "_action": "modify" },
    { "id": "existing-id-2", "description": "Main d'œuvre pose", "quantity": 1, "unit_price_ht": 45, "vat_rate": 10, "_action": "keep" },
    { "id": "new-1705123456-0", "description": "Protection chantier", "quantity": 1, "unit_price_ht": 25, "vat_rate": 20, "_action": "add" }
  ],
  "explanation": "Remplacement du robinet standard par un mitigeur thermostatique (prix ajusté) et ajout protection chantier."
}`

// ===========================================
// OpenAI API Call
// ===========================================
interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
  _action?: 'keep' | 'modify' | 'delete' | 'add'
}

interface SmartEditResult {
  items: QuoteItem[]
  explanation?: string
}

async function callOpenAI(
  instruction: string,
  currentItems: QuoteItem[]
): Promise<SmartEditResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const userPrompt = `DEVIS ACTUEL:
${JSON.stringify(currentItems, null, 2)}

INSTRUCTION DE MODIFICATION:
${instruction}

Applique la modification demandée et retourne le nouveau devis complet en JSON.`

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
      temperature: 0.5,
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

  // Parse and validate the response
  const parsed = JSON.parse(content)

  // Validate with zod
  const validated = aiOutputSchema.parse(parsed)

  // Filter out deleted items and clean up _action field
  const finalItems = validated.items
    .filter(item => item._action !== 'delete')
    .map(({ _action, ...item }) => item)

  return {
    items: finalItems,
    explanation: validated.explanation,
  }
}

// ===========================================
// Fallback: Simple pattern matching
// ===========================================
function applyFallbackEdit(
  instruction: string,
  currentItems: QuoteItem[]
): SmartEditResult {
  const lowerInstruction = instruction.toLowerCase()
  let items = [...currentItems]
  let explanation = ''

  // Pattern: Augmenter de X%
  const increaseMatch = lowerInstruction.match(/augment\w*\s+(?:de\s+)?(\d+)\s*%/)
  if (increaseMatch) {
    const percent = parseInt(increaseMatch[1])
    const factor = 1 + percent / 100

    if (lowerInstruction.includes('quantit')) {
      items = items.map(item => ({
        ...item,
        quantity: Math.round(item.quantity * factor * 100) / 100,
      }))
      explanation = `Quantités augmentées de ${percent}%`
    } else if (lowerInstruction.includes('prix')) {
      items = items.map(item => ({
        ...item,
        unit_price_ht: Math.round(item.unit_price_ht * factor * 100) / 100,
      }))
      explanation = `Prix augmentés de ${percent}%`
    }
  }

  // Pattern: Réduire/Diminuer de X% ou remise
  const decreaseMatch = lowerInstruction.match(/(?:r[ée]dui\w*|diminu\w*|remise)\s+(?:de\s+)?(\d+)\s*%/)
  if (decreaseMatch) {
    const percent = parseInt(decreaseMatch[1])
    const factor = 1 - percent / 100

    items = items.map(item => ({
      ...item,
      unit_price_ht: Math.round(item.unit_price_ht * factor * 100) / 100,
    }))
    explanation = `Remise de ${percent}% appliquée`
  }

  // Pattern: Changer TVA
  const tvaMatch = lowerInstruction.match(/tva\s+(?:[àa]\s+)?(\d+(?:[.,]\d+)?)\s*%/)
  if (tvaMatch) {
    const newTva = parseFloat(tvaMatch[1].replace(',', '.'))
    items = items.map(item => ({
      ...item,
      vat_rate: newTva,
    }))
    explanation = `TVA modifiée à ${newTva}%`
  }

  // Pattern: Ajouter une ligne
  if (lowerInstruction.includes('ajoute') || lowerInstruction.includes('ajout')) {
    const newItem: QuoteItem = {
      id: `new-${Date.now()}-0`,
      description: 'Nouvelle prestation',
      quantity: 1,
      unit_price_ht: 50,
      vat_rate: 20,
    }
    items.push(newItem)
    explanation = 'Nouvelle ligne ajoutée (à personnaliser)'
  }

  // Pattern: Supprimer
  if (lowerInstruction.includes('supprime') || lowerInstruction.includes('retire')) {
    if (lowerInstruction.includes('déplacement') || lowerInstruction.includes('deplacement')) {
      items = items.filter(item =>
        !item.description.toLowerCase().includes('déplacement') &&
        !item.description.toLowerCase().includes('deplacement')
      )
      explanation = 'Ligne de déplacement supprimée'
    } else if (lowerInstruction.includes('dernière') || lowerInstruction.includes('derniere')) {
      items = items.slice(0, -1)
      explanation = 'Dernière ligne supprimée'
    }
  }

  return {
    items,
    explanation: explanation || 'Modification appliquée (mode simplifié)',
  }
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
    const validationResult = smartEditInputSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => e.message).join(', ')
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      )
    }

    const { instruction, currentItems } = validationResult.data

    let result: SmartEditResult

    try {
      // Try OpenAI first
      result = await callOpenAI(instruction, currentItems)
    } catch (error) {
      console.warn('OpenAI call failed, using fallback:', error)
      // Fallback to simple pattern matching
      result = applyFallbackEdit(instruction, currentItems)
    }

    return NextResponse.json(result, {
      headers: { 'X-RateLimit-Remaining': remaining.toString() }
    })

  } catch (error) {
    console.error('❌ Erreur modification intelligente:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du devis' },
      { status: 500 }
    )
  }
}
