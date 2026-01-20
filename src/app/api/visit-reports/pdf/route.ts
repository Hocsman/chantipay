import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { renderToBuffer } from '@react-pdf/renderer'
import { VisitReportPdfDocument } from '@/lib/pdf/VisitReportPdf'
import type { VisitReportResult } from '@/types/visit-report'

const visitReportSchema = z.object({
  summary: z.string(),
  diagnostics: z.array(z.string()),
  nonConformities: z.array(z.object({
    title: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
    reference: z.string().optional(),
    recommendation: z.string().optional(),
  })),
  photoAnnotations: z.array(z.object({
    index: z.number(),
    title: z.string().optional(),
    annotations: z.array(z.string()),
    notes: z.string().optional(),
  })),
  recommendations: z.array(z.string()).optional(),
})

const visitReportPdfInputSchema = z.object({
  report: visitReportSchema,
  photos: z.array(z.string()).min(1).max(6),
  metadata: z.object({
    clientName: z.string().optional(),
    location: z.string().optional(),
    visitDate: z.string().optional(),
    trade: z.string().optional(),
    context: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = visitReportPdfInputSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { report, photos, metadata } = validationResult.data

    for (const photo of photos) {
      if (photo.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Une photo est trop volumineuse. Maximum 4MB par photo.' },
          { status: 400 }
        )
      }
    }

    const pdfBuffer = await renderToBuffer(
      VisitReportPdfDocument({
        report: report as VisitReportResult,
        photos,
        metadata,
      })
    )

    const filename = `rapport-visite-${Date.now()}.pdf`
    const uint8Array = new Uint8Array(pdfBuffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[PDF] Error generating visit report PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
