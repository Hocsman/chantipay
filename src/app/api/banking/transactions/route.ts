/**
 * ===========================================
 * Banking Transactions API Route
 * ===========================================
 * GET /api/banking/transactions?from=&to=&status=all|matched|unmatched
 *
 * Liste les transactions bancaires importées avec la facture liée.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status') || 'all'

    let query = supabase
      .from('bank_transactions')
      .select(`
        *,
        invoice:invoices (
          id,
          invoice_number,
          client_name,
          total,
          payment_status
        )
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(200)

    if (from) {
      query = query.gte('transaction_date', from)
    }
    if (to) {
      query = query.lte('transaction_date', to)
    }

    if (status === 'matched') {
      query = query.not('invoice_id', 'is', null)
    } else if (status === 'unmatched') {
      query = query.is('invoice_id', null)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('[Banking Transactions] Erreur:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Calculer les stats
    const all = transactions || []
    const credits = all.filter(t => t.amount > 0)
    const totalCredits = credits.reduce((s, t) => s + Number(t.amount), 0)
    const matched = credits.filter(t => t.invoice_id)
    const totalMatched = matched.reduce((s, t) => s + Number(t.amount), 0)
    const unmatchedCredits = credits.filter(t => !t.invoice_id)
    const totalUnmatched = unmatchedCredits.reduce((s, t) => s + Number(t.amount), 0)

    return NextResponse.json({
      transactions: all,
      stats: {
        total: all.length,
        credits: credits.length,
        totalCredits,
        matched: matched.length,
        totalMatched,
        unmatched: unmatchedCredits.length,
        totalUnmatched,
      },
    })
  } catch (error) {
    console.error('[Banking Transactions] Erreur inattendue:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
