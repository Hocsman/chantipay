import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuotesExcel, workbookToBuffer } from '@/lib/excel/exportQuotes'

/**
 * GET /api/quotes/export
 * Exporte tous les devis de l'utilisateur en Excel
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

    // Requête simplifiée - sans les relations pour tester
    let query = supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: quotesRaw, error } = await query

    if (error) {
      console.error('Erreur récupération devis:', error)
      return NextResponse.json({
        error: 'Erreur base de données',
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    if (!quotesRaw || quotesRaw.length === 0) {
      return NextResponse.json({ error: 'Aucun devis à exporter' }, { status: 404 })
    }

    // Récupérer les clients séparément
    const clientIds = [...new Set(quotesRaw.map(q => q.client_id).filter(Boolean))]
    let clientsMap: Record<string, { name: string; email?: string; phone?: string; address?: string }> = {}

    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email, phone, address_line1, postal_code, city')
        .in('id', clientIds)

      if (clients) {
        clientsMap = clients.reduce((acc, c) => {
          // Construire l'adresse complète à partir des champs séparés
          const addressParts = [c.address_line1, c.postal_code, c.city].filter(Boolean)
          acc[c.id] = {
            name: c.name,
            email: c.email || undefined,
            phone: c.phone || undefined,
            address: addressParts.length > 0 ? addressParts.join(', ') : undefined
          }
          return acc
        }, {} as Record<string, { name: string; email?: string; phone?: string; address?: string }>)
      }
    }

    // Récupérer les items si nécessaire
    let itemsMap: Record<string, Array<{ description: string; quantity: number; unit_price_ht: number; vat_rate: number }>> = {}

    if (includeItems) {
      const quoteIds = quotesRaw.map(q => q.id)
      const { data: items } = await supabase
        .from('quote_items')
        .select('quote_id, description, quantity, unit_price_ht, vat_rate')
        .in('quote_id', quoteIds)

      if (items) {
        itemsMap = items.reduce((acc, item) => {
          if (!acc[item.quote_id]) {
            acc[item.quote_id] = []
          }
          acc[item.quote_id].push(item)
          return acc
        }, {} as Record<string, Array<{ description: string; quantity: number; unit_price_ht: number; vat_rate: number }>>)
      }
    }

    // Transformer les données
    const quotes = quotesRaw.map(q => {
      const client = q.client_id ? clientsMap[q.client_id] : null
      const totalHt = q.total_ht || 0
      const totalTtc = q.total_ttc || 0

      return {
        id: q.id,
        quote_number: q.quote_number || '',
        created_at: q.created_at,
        status: q.status || 'draft',
        total_ht: totalHt,
        total_ttc: totalTtc,
        total_vat: totalTtc - totalHt,
        valid_until: q.valid_until || q.expires_at,
        signed_at: q.signed_at,
        quote_items: itemsMap[q.id] || [],
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

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erreur export Excel devis:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorStack = error instanceof Error ? error.stack : ''
    return NextResponse.json({
      error: 'Erreur serveur',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
}
