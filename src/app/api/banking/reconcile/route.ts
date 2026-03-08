import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/banking/reconcile
 * Rapprochement manuel : lier ou délier une transaction bancaire d'une facture
 *
 * Body:
 * - action: 'match' | 'unmatch'
 * - transactionId: string
 * - invoiceId?: string (requis pour 'match')
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { action, transactionId, invoiceId } = body

  if (!transactionId || !action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Vérifier que la transaction appartient à l'utilisateur
  const { data: tx, error: txError } = await supabase
    .from('bank_transactions')
    .select('id, amount, transaction_date, invoice_id')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (txError || !tx) {
    return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 })
  }

  // === MATCH ===
  if (action === 'match') {
    if (!invoiceId) {
      return NextResponse.json({ error: 'ID facture requis' }, { status: 400 })
    }

    if (tx.invoice_id) {
      return NextResponse.json({ error: 'Transaction déjà rapprochée' }, { status: 400 })
    }

    // Vérifier que la facture existe et appartient à l'utilisateur
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, payment_status')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Vérifier que la facture n'est pas déjà payée
    if (invoice.payment_status === 'paid') {
      return NextResponse.json({ error: 'Cette facture est déjà marquée comme payée' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Lier la transaction à la facture
    const { error: updateTxError } = await supabase
      .from('bank_transactions')
      .update({
        invoice_id: invoice.id,
        reconciled_at: now,
        reconciled_method: 'manual',
      })
      .eq('id', tx.id)

    if (updateTxError) {
      return NextResponse.json({ error: 'Erreur lors du rapprochement' }, { status: 500 })
    }

    // Marquer la facture comme payée
    await supabase
      .from('invoices')
      .update({
        payment_status: 'paid',
        paid_at: tx.transaction_date,
        paid_amount: invoice.total,
        payment_method: 'virement',
      })
      .eq('id', invoice.id)

    return NextResponse.json({
      success: true,
      message: `Transaction rapprochée avec ${invoice.invoice_number}`,
    })
  }

  // === UNMATCH ===
  if (action === 'unmatch') {
    if (!tx.invoice_id) {
      return NextResponse.json({ error: 'Transaction non rapprochée' }, { status: 400 })
    }

    const previousInvoiceId = tx.invoice_id

    // Délier la transaction
    const { error: updateTxError } = await supabase
      .from('bank_transactions')
      .update({
        invoice_id: null,
        reconciled_at: null,
        reconciled_method: null,
      })
      .eq('id', tx.id)

    if (updateTxError) {
      return NextResponse.json({ error: 'Erreur lors du dé-rapprochement' }, { status: 500 })
    }

    // Remettre la facture en "envoyée" (sauf si elle a été payée par un autre moyen)
    // Vérifier qu'aucune autre transaction n'est liée à cette facture
    const { data: otherTx } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('invoice_id', previousInvoiceId)
      .neq('id', tx.id)
      .limit(1)

    if (!otherTx || otherTx.length === 0) {
      await supabase
        .from('invoices')
        .update({
          payment_status: 'sent',
          paid_at: null,
          paid_amount: null,
          payment_method: null,
        })
        .eq('id', previousInvoiceId)
    }

    return NextResponse.json({
      success: true,
      message: 'Rapprochement supprimé',
    })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
