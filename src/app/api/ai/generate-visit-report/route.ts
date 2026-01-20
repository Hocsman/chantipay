import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type {
  VisitReportResult,
  VisitReportPhotoAnnotation,
  VisitReportNonConformity,
  VisitReportSeverity,
} from '@/types/visit-report'

// ===========================================
// Rate Limiting (Best-effort in-memory)
// ===========================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 3 // 3 requests per window

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
const visitReportInputSchema = z.object({
  photos: z.array(
    z.string()
      .min(100, 'Image invalide')
      .refine(
        (val) => val.startsWith('data:image/'),
        'Format d\'image invalide (doit être base64 avec préfixe data:image/)'
      )
  ).min(1, 'Au moins une photo est requise').max(6, 'Maximum 6 photos'),
  trade: z.string().optional(),
  context: z.string().max(1000).optional(),
  clientName: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  visitDate: z.string().max(50).optional(),
})

// ===========================================
// System Prompt for Vision Analysis
// ===========================================
const SYSTEM_PROMPT = `Tu es un expert en diagnostic de travaux pour artisans français.
Tu analyses un ensemble de photos d'une visite technique pour générer un rapport professionnel.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte additionnel
2. Décris clairement l'état général observé
3. Liste des diagnostics et anomalies potentielles
4. Liste les non-conformités si détectées (sinon tableau vide)
5. Ajoute des annotations par photo (observations courtes)
6. Sois prudent: si tu n'es pas sûr, indique-le dans les notes

FORMAT DE RÉPONSE EXACT:
{
  "summary": "Résumé général de la visite",
  "diagnostics": ["Diagnostic 1", "Diagnostic 2"],
  "nonConformities": [
    {
      "title": "Non-conformité détectée",
      "severity": "low|medium|high",
      "reference": "Norme/DTU/NF (optionnel)",
      "recommendation": "Action corrective"
    }
  ],
  "photoAnnotations": [
    {
      "index": 0,
      "title": "Titre court (optionnel)",
      "annotations": ["Observation 1", "Observation 2"],
      "notes": "Précision optionnelle"
    }
  ],
  "recommendations": ["Recommandation 1", "Recommandation 2"]
}`

// ===========================================
// OpenAI Vision API Call
// ===========================================
async function callOpenAIVision(
  photos: string[],
  trade?: string,
  context?: string,
  clientName?: string,
  location?: string,
  visitDate?: string
): Promise<VisitReportResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const model = 'gpt-4o'

  const metaLines = [
    trade ? `Métier: ${trade}` : '',
    clientName ? `Client: ${clientName}` : '',
    location ? `Lieu: ${location}` : '',
    visitDate ? `Date de visite: ${visitDate}` : '',
    context ? `Contexte: ${context}` : '',
  ].filter(Boolean)

  const userPrompt = [
    'Analyse ces photos de visite technique et génère un rapport.',
    metaLines.length ? `\n${metaLines.join('\n')}` : '',
  ].join('\n')

  const imageContent = photos.map((photo) => ({
    type: 'image_url' as const,
    image_url: {
      url: photo,
      detail: 'high',
    },
  }))

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
            ...imageContent,
          ],
        },
      ],
      temperature: 0.4,
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

  const parsed = JSON.parse(content)
  return normalizeReportResult(parsed, photos.length)
}

// ===========================================
// Normalization + Fallback
// ===========================================
function normalizeReportResult(parsed: any, photoCount: number): VisitReportResult {
  const diagnostics = Array.isArray(parsed?.diagnostics)
    ? parsed.diagnostics.filter((item: unknown) => typeof item === 'string')
    : []

  const recommendations = Array.isArray(parsed?.recommendations)
    ? parsed.recommendations.filter((item: unknown) => typeof item === 'string')
    : []

  const nonConformities = Array.isArray(parsed?.nonConformities)
    ? parsed.nonConformities.map((item: any) => normalizeNonConformity(item)).filter(Boolean)
    : []

  const photoAnnotations = Array.isArray(parsed?.photoAnnotations)
    ? parsed.photoAnnotations
        .map((item: any) => normalizePhotoAnnotation(item))
        .filter((item: VisitReportPhotoAnnotation | null): item is VisitReportPhotoAnnotation => !!item)
        .filter((item) => item.index >= 0 && item.index < photoCount)
    : []

  return {
    summary: typeof parsed?.summary === 'string'
      ? parsed.summary
      : 'Analyse réalisée. Merci de compléter le rapport si nécessaire.',
    diagnostics,
    nonConformities,
    photoAnnotations,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  }
}

function normalizeNonConformity(item: any): VisitReportNonConformity | null {
  if (!item || typeof item.title !== 'string') return null
  const severity = isSeverity(item.severity) ? item.severity : 'medium'
  return {
    title: item.title,
    severity,
    reference: typeof item.reference === 'string' ? item.reference : undefined,
    recommendation: typeof item.recommendation === 'string' ? item.recommendation : undefined,
  }
}

function normalizePhotoAnnotation(item: any): VisitReportPhotoAnnotation | null {
  if (!item || typeof item.index !== 'number') return null

  const annotations = Array.isArray(item.annotations)
    ? item.annotations.filter((entry: unknown) => typeof entry === 'string')
    : []

  return {
    index: item.index,
    title: typeof item.title === 'string' ? item.title : undefined,
    annotations,
    notes: typeof item.notes === 'string' ? item.notes : undefined,
  }
}

function isSeverity(value: unknown): value is VisitReportSeverity {
  return value === 'low' || value === 'medium' || value === 'high'
}

function generateFallbackReport(photoCount: number): VisitReportResult {
  const photoAnnotations: VisitReportPhotoAnnotation[] = []
  for (let i = 0; i < photoCount; i += 1) {
    photoAnnotations.push({
      index: i,
      annotations: ['Analyse automatique indisponible pour cette photo.'],
    })
  }

  return {
    summary: 'Analyse automatique indisponible. Merci de compléter le rapport manuellement.',
    diagnostics: [],
    nonConformities: [],
    photoAnnotations,
    recommendations: [
      'Ajouter vos observations principales.',
      'Lister les non-conformités si nécessaire.',
    ],
  }
}

// ===========================================
// API Route Handler
// ===========================================
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter quelques minutes.' },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': '0' },
        }
      )
    }

    const body = await request.json()
    const validationResult = visitReportInputSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { photos, trade, context, clientName, location, visitDate } = validationResult.data

    for (const photo of photos) {
      if (photo.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Une photo est trop volumineuse. Maximum 4MB par photo.' },
          { status: 400 }
        )
      }
    }

    let report: VisitReportResult

    try {
      report = await callOpenAIVision(photos, trade, context, clientName, location, visitDate)
    } catch (error) {
      console.warn('OpenAI Vision call failed, using fallback:', error)
      report = generateFallbackReport(photos.length)
    }

    return NextResponse.json(
      { ...report, photos },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    )
  } catch (error) {
    console.error('❌ Erreur génération rapport de visite:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}
