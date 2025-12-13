import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * ===========================================
 * Quote PDF Generation API Route
 * ===========================================
 * GET /api/quotes/[id]/pdf
 *
 * Generates a PDF document for a quote with all details.
 * Currently returns a minimal placeholder PDF - see TODO for full implementation.
 *
 * URL Parameters:
 * - id: Quote UUID
 *
 * Response:
 * - Content-Type: application/pdf
 * - Content-Disposition: attachment; filename="{quote_number}.pdf"
 *
 * Status Codes:
 * - 200: Success - PDF generated and returned
 * - 401: Unauthorized (user not authenticated)
 * - 404: Quote not found or doesn't belong to user
 * - 500: Server error
 *
 * Business Logic:
 * 1. Verify user is authenticated
 * 2. Load quote with items, client, profile, and settings
 * 3. Generate PDF with all details
 * 4. Return PDF as downloadable file
 *
 * TODO: Implement real PDF generation using a library:
 * - Option 1: @react-pdf/renderer (React components → PDF)
 * - Option 2: puppeteer/playwright (HTML → PDF)
 * - Option 3: pdfkit (Programmatic PDF generation)
 * - Option 4: jspdf (Lightweight alternative)
 *
 * PDF should include:
 * - Company logo and info
 * - Quote number and date
 * - Client details
 * - Line items table with quantities, prices, VAT
 * - Totals (HT, VAT, TTC)
 * - Deposit amount if applicable
 * - Signature if signed
 * - Footer text and legal info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer le devis avec les items et le client
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
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les infos de l'utilisateur (profil + settings)
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

    // TODO: Générer un vrai PDF avec une bibliothèque comme @react-pdf/renderer
    // ou puppeteer/playwright pour générer un PDF à partir d'HTML
    
    // Pour l'instant, on retourne un PDF placeholder
    const pdfContent = generatePlaceholderPDF(quote, profile, settings)

    return new Response(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quote_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePlaceholderPDF(quote: any, profile: any, settings: any): string {
  // TODO: Implémenter la génération PDF réelle
  // Options recommandées:
  // 1. @react-pdf/renderer - Pour générer des PDFs côté serveur avec React
  // 2. puppeteer/playwright - Pour générer des PDFs à partir d'HTML
  // 3. pdfkit - Pour générer des PDFs programmatiquement
  // 4. jspdf - Alternative légère
  
  // Placeholder: créer un PDF minimal valide
  // En production, utiliser une vraie bibliothèque PDF
  
  const pdfHeader = '%PDF-1.4\n'
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length 200 >>\nstream\nBT\n/F1 24 Tf\n50 700 Td\n(${quote.quote_number}) Tj\n0 -40 Td\n/F1 12 Tf\n(Client: ${quote.clients?.name || 'N/A'}) Tj\n0 -20 Td\n(Total TTC: ${quote.total_ttc || 0} EUR) Tj\n0 -40 Td\n(${profile?.company_name || 'ChantiPay'}) Tj\n0 -20 Td\n(${settings?.pdf_footer_text || 'Merci pour votre confiance.'}) Tj\nET\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]
  
  let xref = 'xref\n0 6\n'
  xref += '0000000000 65535 f \n'
  
  let offset = pdfHeader.length
  for (let i = 0; i < objects.length; i++) {
    xref += String(offset).padStart(10, '0') + ' 00000 n \n'
    offset += objects[i].length
  }
  
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`
  
  return pdfHeader + objects.join('') + xref + trailer
}
