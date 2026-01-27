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
    const { data: invoiceRaw, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        created_at,
        due_date,
        payment_status,
        client_name,
        client_email,
        client_phone,
        client_address,
        subtotal,
        tax_amount,
        total,
        paid_at,
        payment_method,
        invoice_items (
          description,
          quantity,
          unit_price,
          total
        )
      `)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (error || !invoiceRaw) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Transformer les données pour correspondre au format attendu
    const invoice = {
      id: invoiceRaw.id,
      invoice_number: invoiceRaw.invoice_number,
      created_at: invoiceRaw.created_at,
      due_date: invoiceRaw.due_date,
      status: invoiceRaw.payment_status,
      client_name: invoiceRaw.client_name,
      client_email: invoiceRaw.client_email,
      client_phone: invoiceRaw.client_phone,
      client_address: invoiceRaw.client_address,
      total_ht: invoiceRaw.subtotal || 0,
      total_vat: invoiceRaw.tax_amount || 0,
      total_ttc: invoiceRaw.total || 0,
      paid_at: invoiceRaw.paid_at,
      payment_method: invoiceRaw.payment_method,
      invoice_items: invoiceRaw.invoice_items?.map((item: { description: string; quantity: number; unit_price: number; total: number }) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price || 0,
        vat_rate: 20,
      })) || [],
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
