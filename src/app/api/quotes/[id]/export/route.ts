import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSingleQuoteExcel, workbookToBuffer } from '@/lib/excel/exportQuotes'

/**
 * GET /api/quotes/[id]/export
 * Exporte un devis spécifique en Excel
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le devis avec ses lignes
    const { data: quoteRaw, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        created_at,
        status,
        total_ht,
        total_ttc,
        total_vat,
        valid_until,
        signed_at,
        clients (
          name,
          email,
          phone,
          address
        ),
        quote_items (
          description,
          quantity,
          unit_price_ht,
          vat_rate
        )
      `)
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()

    if (error || !quoteRaw) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Transformer les données
    const client = Array.isArray(quoteRaw.clients) ? quoteRaw.clients[0] : quoteRaw.clients
    const quote = {
      ...quoteRaw,
      client_name: client?.name || 'Client',
      client_email: client?.email || '',
      client_phone: client?.phone || '',
      client_address: client?.address || '',
    }

    // Générer le fichier Excel
    const workbook = generateSingleQuoteExcel(quote)
    const buffer = workbookToBuffer(workbook)

    // Nom du fichier
    const quoteNumber = quote.quote_number || quote.id.slice(0, 8)
    const filename = `devis_${quoteNumber}.xlsx`

    // Retourner le fichier
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur export Excel devis:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
