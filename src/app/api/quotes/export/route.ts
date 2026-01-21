import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuotesExcel, workbookToBuffer } from '@/lib/excel/exportQuotes'

/**
 * GET /api/quotes/export
 * Exporte tous les devis de l'utilisateur en Excel
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

    // Construire la requête - utiliser la même structure que /api/quotes
    let query = supabase
      .from('quotes')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          address
        ),
        items:quote_items (
          id,
          description,
          quantity,
          unit_price_ht,
          vat_rate
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (status) {
      query = query.eq('status', status)
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate)
    }
    if (toDate) {
      query = query.lte('created_at', toDate)
    }

    const { data: quotesRaw, error } = await query

    if (error) {
      console.error('Erreur récupération devis:', error)
      return NextResponse.json({ error: 'Erreur base de données', details: error.message }, { status: 500 })
    }

    if (!quotesRaw || quotesRaw.length === 0) {
      return NextResponse.json({ error: 'Aucun devis à exporter' }, { status: 404 })
    }

    // Transformer les données pour correspondre au format attendu
    const quotes = quotesRaw.map(q => {
      // clients peut être un objet, un tableau, ou null selon la relation Supabase
      let client = null
      if (q.clients) {
        client = Array.isArray(q.clients) ? q.clients[0] : q.clients
      }

      // Calculer total_vat si non présent
      const totalHt = q.total_ht || 0
      const totalTtc = q.total_ttc || 0
      const totalVat = q.total_vat ?? (totalTtc - totalHt)

      return {
        id: q.id,
        quote_number: q.quote_number || '',
        created_at: q.created_at,
        status: q.status || 'draft',
        total_ht: totalHt,
        total_ttc: totalTtc,
        total_vat: totalVat,
        valid_until: q.valid_until || q.expires_at,
        signed_at: q.signed_at,
        quote_items: q.items || [],
        client_name: client?.name || 'Client inconnu',
        client_email: client?.email || '',
        client_phone: client?.phone || '',
        client_address: client?.address || '',
      }
    })

    // Générer le fichier Excel
    const workbook = generateQuotesExcel(quotes, { includeItems })
    const buffer = workbookToBuffer(workbook)

    // Nom du fichier avec date
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `devis_export_${dateStr}.xlsx`

    // Retourner le fichier
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur export Excel devis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Erreur serveur', details: errorMessage }, { status: 500 })
  }
}
