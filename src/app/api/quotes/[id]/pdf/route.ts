/**
 * ===========================================
 * Quote PDF Generation API Route
 * ===========================================
 * GET /api/quotes/[id]/pdf
 *
 * Generates a professional PDF document for a quote using @react-pdf/renderer.
 * The PDF includes all quote details: company info, client, items, totals, signature.
 *
 * URL Parameters:
 * - id: Quote UUID
 *
 * Response:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment; filename="devis-{quote_number}.pdf"
 *
 * Status Codes:
 * - 200: Success - PDF generated and returned
 * - 401: Unauthorized (user not authenticated)
 * - 404: Quote not found or doesn't belong to user
 * - 500: Server error during PDF generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/lib/pdf/QuotePdf'
import type { Client, QuoteItem, Profile, Settings } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const supabase = await createClient()

    // ============================================
    // 1. Vérifier l'authentification
    // ============================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[PDF] Auth error:', authError?.message)
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // ============================================
    // 2. Récupérer le devis avec les items et le client
    // ============================================
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*),
        quote_items (*)
      `)
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()

    if (quoteError || !quote) {
      console.error('[PDF] Quote not found:', quoteError?.message)
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Type assertions for related data
    const client = quote.clients as unknown as Client | null
    const quoteItems = (quote.quote_items as unknown as QuoteItem[]) || []

    if (!client) {
      console.error('[PDF] Client not found for quote:', quoteId)
      return NextResponse.json(
        { error: 'Client du devis non trouvé' },
        { status: 404 }
      )
    }

    // ============================================
    // 3. Récupérer le profil et les settings
    // ============================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // ============================================
    // 4. Générer le PDF avec @react-pdf/renderer
    // ============================================
    console.log('[PDF] Generating PDF for quote:', quote.quote_number)

    const pdfBuffer = await renderToBuffer(
      QuotePdfDocument({
        quote,
        quoteItems,
        client,
        profile: profile as Profile | null,
        settings: settings as Settings | null,
      })
    )

    console.log('[PDF] PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    // ============================================
    // 5. Retourner le PDF avec les headers appropriés
    // ============================================
    const filename = `devis-${quote.quote_number}.pdf`

    // Convertir le Buffer en Uint8Array pour la compatibilité avec Response
    const uint8Array = new Uint8Array(pdfBuffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    // ============================================
    // Error handling
    // ============================================
    console.error('[PDF] Error generating PDF:', error)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('[PDF] Error name:', error.name)
      console.error('[PDF] Error message:', error.message)
      console.error('[PDF] Error stack:', error.stack)
    }

    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
