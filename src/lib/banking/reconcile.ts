/**
 * ===========================================
 * Rapprochement Bancaire Automatique
 * ===========================================
 * Match les transactions bancaires avec les factures non payées.
 *
 * Algorithme en 2 passes :
 * 1. Match par référence facture dans le libellé (auto_ref)
 * 2. Match par montant exact — uniquement si 1 seule facture correspond (auto_amount)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ReconcileResult {
  matched: number
  unmatched: number
  details: { transactionId: string; invoiceId: string; invoiceNumber: string; method: string; amount: number }[]
}

interface UnpaidInvoice {
  id: string
  invoice_number: string
  total: number
  payment_status: string
}

interface TransactionToReconcile {
  id: string
  amount: number
  reference: string | null
  transaction_date: string
}

export async function reconcileTransactions(
  supabase: SupabaseClient,
  userId: string,
  transactionIds: string[]
): Promise<ReconcileResult> {
  const result: ReconcileResult = { matched: 0, unmatched: 0, details: [] }

  if (transactionIds.length === 0) return result

  // Récupérer les transactions non rapprochées (crédit uniquement)
  const { data: transactions } = await supabase
    .from('bank_transactions')
    .select('id, amount, reference, transaction_date')
    .eq('user_id', userId)
    .in('id', transactionIds)
    .is('invoice_id', null)
    .gt('amount', 0)

  if (!transactions || transactions.length === 0) {
    result.unmatched = transactionIds.length
    return result
  }

  // Récupérer les factures non payées
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, payment_status')
    .eq('user_id', userId)
    .in('payment_status', ['sent', 'overdue'])

  if (!unpaidInvoices || unpaidInvoices.length === 0) {
    result.unmatched = transactions.length
    return result
  }

  // Set des factures déjà matchées dans ce batch (pour ne pas matcher 2 tx sur la même facture)
  const matchedInvoiceIds = new Set<string>()
  const matchedTxIds = new Set<string>()

  // ==========================================
  // Passe 1 : Match par référence (auto_ref)
  // ==========================================
  for (const tx of transactions as TransactionToReconcile[]) {
    if (!tx.reference || matchedTxIds.has(tx.id)) continue

    // Chercher une facture dont le numéro correspond à la référence
    const matchingInvoice = unpaidInvoices.find((inv: UnpaidInvoice) => {
      if (matchedInvoiceIds.has(inv.id)) return false
      const invNum = inv.invoice_number.toUpperCase().replace(/\s/g, '')
      const ref = tx.reference!.toUpperCase().replace(/\s/g, '')
      return invNum === ref || invNum.includes(ref) || ref.includes(invNum)
    })

    if (matchingInvoice) {
      await markReconciled(supabase, tx, matchingInvoice, 'auto_ref')
      matchedInvoiceIds.add(matchingInvoice.id)
      matchedTxIds.add(tx.id)
      result.matched++
      result.details.push({
        transactionId: tx.id,
        invoiceId: matchingInvoice.id,
        invoiceNumber: matchingInvoice.invoice_number,
        method: 'auto_ref',
        amount: tx.amount,
      })
    }
  }

  // ==========================================
  // Passe 2 : Match par montant exact (auto_amount)
  // ==========================================
  for (const tx of transactions as TransactionToReconcile[]) {
    if (matchedTxIds.has(tx.id)) continue

    // Chercher les factures avec montant identique (tolérance ±0.01€)
    const amountMatches = unpaidInvoices.filter((inv: UnpaidInvoice) => {
      if (matchedInvoiceIds.has(inv.id)) return false
      return Math.abs(inv.total - tx.amount) <= 0.01
    })

    // Seulement si 1 seule facture matche (pas d'ambiguïté)
    if (amountMatches.length === 1) {
      const matchingInvoice = amountMatches[0]
      await markReconciled(supabase, tx, matchingInvoice, 'auto_amount')
      matchedInvoiceIds.add(matchingInvoice.id)
      matchedTxIds.add(tx.id)
      result.matched++
      result.details.push({
        transactionId: tx.id,
        invoiceId: matchingInvoice.id,
        invoiceNumber: matchingInvoice.invoice_number,
        method: 'auto_amount',
        amount: tx.amount,
      })
    }
  }

  result.unmatched = transactions.length - result.matched

  return result
}

/** Marque une transaction comme rapprochée et met à jour la facture */
async function markReconciled(
  supabase: SupabaseClient,
  tx: TransactionToReconcile,
  invoice: UnpaidInvoice,
  method: string
) {
  const now = new Date().toISOString()

  // Mettre à jour la transaction
  await supabase
    .from('bank_transactions')
    .update({
      invoice_id: invoice.id,
      reconciled_at: now,
      reconciled_method: method,
    })
    .eq('id', tx.id)

  // Mettre à jour la facture → payée
  await supabase
    .from('invoices')
    .update({
      payment_status: 'paid',
      paid_at: tx.transaction_date,
      paid_amount: invoice.total,
      payment_method: 'virement',
    })
    .eq('id', invoice.id)
}
