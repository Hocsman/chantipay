import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/search?q=terme
 * Recherche globale dans clients, devis, factures et avoirs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const searchPattern = `%${query}%`

    // Lancer toutes les recherches en parallèle
    const [clientsRes, quotesRes, invoicesRes, creditNotesRes] = await Promise.all([
      // Clients
      supabase
        .from('clients')
        .select('id, name, email, phone, company_name, city')
        .eq('user_id', user.id)
        .or(`name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern},company_name.ilike.${searchPattern},city.ilike.${searchPattern}`)
        .limit(5),

      // Devis
      supabase
        .from('quotes')
        .select('id, quote_number, status, total_ttc, clients!inner(name)')
        .eq('user_id', user.id)
        .or(`quote_number.ilike.${searchPattern},clients.name.ilike.${searchPattern}`)
        .limit(5),

      // Factures
      supabase
        .from('invoices')
        .select('id, invoice_number, client_name, payment_status, total')
        .eq('user_id', user.id)
        .or(`invoice_number.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
        .limit(5),

      // Avoirs
      supabase
        .from('credit_notes')
        .select('id, credit_note_number, client_name, status, total')
        .eq('user_id', user.id)
        .or(`credit_note_number.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
        .limit(5),
    ])

    // Formatter les résultats
    const results = [
      ...(clientsRes.data || []).map(c => ({
        type: 'client' as const,
        id: c.id,
        title: c.name,
        subtitle: [c.company_name, c.city, c.email].filter(Boolean).join(' · '),
        href: `/dashboard/clients/${c.id}`,
      })),
      ...(quotesRes.data || []).map(q => ({
        type: 'quote' as const,
        id: q.id,
        title: q.quote_number,
        subtitle: `${(q.clients as unknown as { name: string })?.name || 'Client'} · ${Number(q.total_ttc || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
        status: q.status,
        href: `/dashboard/quotes/${q.id}`,
      })),
      ...(invoicesRes.data || []).map(i => ({
        type: 'invoice' as const,
        id: i.id,
        title: i.invoice_number,
        subtitle: `${i.client_name} · ${Number(i.total || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
        status: i.payment_status,
        href: `/dashboard/invoices/${i.id}`,
      })),
      ...(creditNotesRes.data || []).map(cn => ({
        type: 'credit_note' as const,
        id: cn.id,
        title: cn.credit_note_number,
        subtitle: `${cn.client_name} · ${Number(cn.total || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
        status: cn.status,
        href: `/dashboard/avoirs/${cn.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Erreur recherche:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
