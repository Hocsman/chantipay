import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ===========================================
// Rate Limiting (Best-effort in-memory)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 requests per window (Vision is more expensive)

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
const analyzePhotoInputSchema = z.object({
  imageBase64: z.string()
    .min(100, 'Image invalide')
    .refine(
      (val) => val.startsWith('data:image/'),
      'Format d\'image invalide (doit être base64 avec préfixe data:image/)'
    ),
  trade: z.string().optional(),
  context: z.string().max(500).optional(),
})

// ===========================================
// Output Schema
// ===========================================
interface PhotoAnalysisResult {
  description: string
  detectedElements: {
    name: string
    quantity?: number
    condition?: string
    notes?: string
  }[]
  suggestedItems: {
    description: string
    quantity: number
    unit_price_ht: number
    vat_rate: number
  }[]
  estimatedSurface?: string
  additionalNotes?: string
}

// ===========================================
// System Prompt for Vision Analysis
// ===========================================
const SYSTEM_PROMPT = `Tu es un expert en estimation de travaux pour artisans français (plombiers, électriciens, maçons, peintres, menuisiers, etc.).
Tu analyses des photos de chantiers pour aider à créer des devis professionnels.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte additionnel
2. Identifie les éléments visibles sur la photo (équipements, matériaux, surfaces)
3. Estime les quantités quand c'est possible
4. Évalue l'état des éléments (bon, usé, à remplacer)
5. Propose des lignes de devis réalistes avec prix du marché français
6. Sois prudent dans tes estimations, mieux vaut sous-estimer

FORMAT DE RÉPONSE EXACT:
{
  "description": "Description générale de ce qui est visible sur la photo",
  "detectedElements": [
    {
      "name": "Nom de l'élément détecté",
      "quantity": 1,
      "condition": "bon/usé/à remplacer",
      "notes": "Observations supplémentaires"
    }
  ],
  "suggestedItems": [
    {
      "description": "Ligne de devis suggérée",
      "quantity": 1,
      "unit_price_ht": 100,
      "vat_rate": 10
    }
  ],
  "estimatedSurface": "Estimation de surface si applicable (ex: ~15m²)",
  "additionalNotes": "Recommandations ou points d'attention"
}

TVA applicable:
- 10% pour travaux de rénovation dans logements > 2 ans
- 20% pour construction neuve ou matériel seul
- 5.5% pour travaux d'amélioration énergétique

IMPORTANT:
- Si la photo n'est pas claire ou hors sujet, indique-le dans la description
- Ne génère pas de lignes de devis si tu ne peux pas identifier les travaux
- Limite-toi à 5-8 lignes de devis maximum
- Les prix doivent être réalistes pour le marché français actuel`

// ===========================================
// OpenAI Vision API Call
// ===========================================
async function callOpenAIVision(
  imageBase64: string,
  trade?: string,
  context?: string
): Promise<PhotoAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Use GPT-4o for vision (or GPT-4 Vision)
  const model = 'gpt-4o'

  const userPrompt = [
    trade ? `Métier de l'artisan: ${trade}` : '',
    context ? `Contexte additionnel: ${context}` : '',
    '',
    'Analyse cette photo de chantier et génère une estimation pour un devis professionnel.',
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
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high',
              },
            },
          ],
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI Vision API error:', error)
    throw new Error(`OpenAI Vision API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  // Parse the response
  const parsed = JSON.parse(content)

  // Validate structure
  if (!parsed.description || !Array.isArray(parsed.suggestedItems)) {
    throw new Error('Invalid response structure')
  }

  return parsed as PhotoAnalysisResult
}

// ===========================================
// Fallback if Vision fails
// ===========================================
function generateFallbackResult(): PhotoAnalysisResult {
  return {
    description: 'Impossible d\'analyser la photo. Veuillez réessayer avec une image plus claire ou décrire les travaux manuellement.',
    detectedElements: [],
    suggestedItems: [],
    additionalNotes: 'L\'analyse automatique n\'a pas pu être effectuée. Vous pouvez toujours créer votre devis manuellement ou utiliser la génération par description textuelle.',
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
        { error: 'Trop de requêtes. L\'analyse de photos est limitée à 5 par 10 minutes.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': '0' }
        }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const validationResult = analyzePhotoInputSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => e.message).join(', ')
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      )
    }

    const { imageBase64, trade, context } = validationResult.data

    // Check image size (max ~4MB base64)
    if (imageBase64.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image trop volumineuse. Maximum 4MB.' },
        { status: 400 }
      )
    }

    let result: PhotoAnalysisResult

    try {
      // Call OpenAI Vision API
      result = await callOpenAIVision(imageBase64, trade, context)
    } catch (error) {
      console.warn('OpenAI Vision call failed:', error)
      // Return fallback result
      result = generateFallbackResult()
    }

    return NextResponse.json(result, {
      headers: { 'X-RateLimit-Remaining': remaining.toString() }
    })

  } catch (error) {
    console.error('❌ Erreur analyse photo:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de la photo' },
      { status: 500 }
    )
  }
}
