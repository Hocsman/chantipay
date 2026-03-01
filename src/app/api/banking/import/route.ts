/**
 * ===========================================
 * Banking Import API Route
 * ===========================================
 * POST /api/banking/import
 *
 * Upload d'un fichier CSV ou OFX de relevé bancaire.
 * Parse les transactions, filtre les doublons, insère en base,
 * puis lance le rapprochement automatique.
 *
 * Request: multipart/form-data avec champ "file"
 *
 * Response:
 * {
 *   imported: number,
 *   duplicates: number,
 *   matched: number,
 *   unmatched: number,
 *   details: [...]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectAndParse, hashTransaction } from '@/lib/banking/parseTransactions'
import { reconcileTransactions } from '@/lib/banking/reconcile'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Lire le fichier uploadé
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier l'extension
    const filename = file.name.toLowerCase()
    if (!filename.endsWith('.csv') && !filename.endsWith('.ofx') && !filename.endsWith('.qfx')) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez un fichier CSV ou OFX.' },
        { status: 400 }
      )
    }

    // Lire le contenu
    const content = await file.text()
    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Le fichier est vide' },
        { status: 400 }
      )
    }

    // Parser les transactions
    let parsed
    try {
      parsed = detectAndParse(content, file.name)
    } catch (parseError: any) {
      return NextResponse.json(
        { error: parseError.message || 'Erreur de parsing du fichier' },
        { status: 400 }
      )
    }

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: 'Aucune transaction trouvée dans le fichier' },
        { status: 400 }
      )
    }

    // Calculer les hashes pour détecter les doublons
    const batchId = `${Date.now()}_${file.name}`
    const transactionsWithHash = parsed.map(tx => ({
      ...tx,
      hash: hashTransaction(tx),
    }))

    // Récupérer les hashes existants pour cet utilisateur
    const hashes = transactionsWithHash.map(tx => tx.hash)
    const { data: existingHashes } = await supabase
      .from('bank_transactions')
      .select('raw_hash')
      .eq('user_id', user.id)
      .in('raw_hash', hashes)

    const existingHashSet = new Set((existingHashes || []).map(h => h.raw_hash))

    // Filtrer les doublons
    const newTransactions = transactionsWithHash.filter(tx => !existingHashSet.has(tx.hash))
    const duplicateCount = transactionsWithHash.length - newTransactions.length

    if (newTransactions.length === 0) {
      return NextResponse.json({
        imported: 0,
        duplicates: duplicateCount,
        matched: 0,
        unmatched: 0,
        details: [],
        message: 'Toutes les transactions existent déjà (doublons).',
      })
    }

    // Insérer les nouvelles transactions
    const rows = newTransactions.map(tx => ({
      user_id: user.id,
      transaction_date: tx.date,
      label: tx.label,
      amount: tx.amount,
      reference: tx.reference || null,
      import_batch: batchId,
      raw_hash: tx.hash,
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('bank_transactions')
      .insert(rows)
      .select('id')

    if (insertError) {
      console.error('[Banking Import] Erreur insertion:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'import des transactions', details: insertError.message },
        { status: 500 }
      )
    }

    const insertedIds = (inserted || []).map(t => t.id)

    // Lancer le rapprochement automatique
    const reconcileResult = await reconcileTransactions(supabase, user.id, insertedIds)

    return NextResponse.json({
      imported: newTransactions.length,
      duplicates: duplicateCount,
      matched: reconcileResult.matched,
      unmatched: reconcileResult.unmatched,
      details: reconcileResult.details,
    })
  } catch (error) {
    console.error('[Banking Import] Erreur inattendue:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
