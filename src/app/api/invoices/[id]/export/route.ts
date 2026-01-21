import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSingleInvoiceExcel, workbookToBuffer } from '@/lib/excel/exportInvoices'

/**
 * GET /api/invoices/[id]/export
 * Exporte une facture spécifique en Excel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer la facture avec ses lignes
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        created_at,
        due_date,
        status,
        client_name,
        client_email,
        client_phone,
        client_address,
        total_ht,
        total_ttc,
        total_vat,
        paid_at,
        payment_method,
        invoice_items (
          description,
          quantity,
          unit_price_ht,
          vat_rate
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Générer le fichier Excel
    const workbook = generateSingleInvoiceExcel(invoice)
    const buffer = workbookToBuffer(workbook)

    // Nom du fichier
    const invoiceNumber = invoice.invoice_number || invoice.id.slice(0, 8)
    const filename = `facture_${invoiceNumber}.xlsx`

    // Retourner le fichier
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur export Excel facture:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
