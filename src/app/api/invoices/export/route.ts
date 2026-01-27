import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInvoicesExcel, workbookToBuffer } from '@/lib/excel/exportInvoices'

/**
 * GET /api/invoices/export
 * Exporte toutes les factures de l'utilisateur en Excel
 *
 * Query params:
 * - includeItems: boolean (inclure le détail des lignes)
 * - status: string (filtrer par statut)
 * - from: string (date de début, ISO)
 * - to: string (date de fin, ISO)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Paramètres de filtrage
    const { searchParams } = new URL(request.url)
    const includeItems = searchParams.get('includeItems') === 'true'
    const status = searchParams.get('status')
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    // Construire la requête
    let query = supabase
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (status) {
      query = query.eq('payment_status', status)
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    const { data: invoicesRaw, error } = await query

    if (error) {
      console.error('Erreur récupération factures:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!invoicesRaw || invoicesRaw.length === 0) {
      return NextResponse.json({ error: 'Aucune facture à exporter' }, { status: 404 })
    }

    // Transformer les données pour correspondre au format attendu par generateInvoicesExcel
    const invoices = invoicesRaw.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      created_at: inv.created_at,
      due_date: inv.due_date,
      status: inv.payment_status, // payment_status -> status
      client_name: inv.client_name,
      client_email: inv.client_email,
      client_phone: inv.client_phone,
      client_address: inv.client_address,
      total_ht: inv.subtotal || 0, // subtotal -> total_ht
      total_vat: inv.tax_amount || 0, // tax_amount -> total_vat
      total_ttc: inv.total || 0, // total -> total_ttc
      paid_at: inv.paid_at,
      payment_method: inv.payment_method,
      invoice_items: inv.invoice_items?.map((item: { description: string; quantity: number; unit_price: number; total: number }) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price || 0, // unit_price -> unit_price_ht
        vat_rate: 20, // Valeur par défaut
      })) || [],
    }))

    // Générer le fichier Excel
    const workbook = generateInvoicesExcel(invoices, { includeItems })
    const buffer = workbookToBuffer(workbook)

    // Nom du fichier avec date
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `factures_export_${dateStr}.xlsx`

    // Retourner le fichier
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur export Excel factures:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
