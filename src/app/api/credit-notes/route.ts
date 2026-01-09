import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/credit-notes
 * Liste tous les avoirs de l'utilisateur connecté
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: creditNotes, error } = await supabase
      .from('credit_notes')
      .select(`
        *,
        items:credit_note_items (
          id,
          description,
          quantity,
          unit_price
        )
      `)
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Erreur récupération avoirs:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des avoirs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ creditNotes })
  } catch (error) {
    console.error('Erreur API credit-notes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/credit-notes
 * Crée un nouvel avoir avec ses lignes
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.client_name || !body.issue_date) {
      return NextResponse.json(
        { error: 'Le nom du client et la date d\'émission sont requis' },
        { status: 400 }
      )
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une ligne est requise' },
        { status: 400 }
      )
    }

    // S'assurer que les montants sont négatifs
    const items = body.items.map((item: any) => ({
      ...item,
      unit_price: -Math.abs(item.unit_price || 0),
      total: -Math.abs(item.total || 0),
    }))

    const subtotal = -Math.abs(body.subtotal || 0)
    const tax_amount = -Math.abs(body.tax_amount || 0)
    const total = -Math.abs(body.total || 0)

    // Créer l'avoir
    const { data: creditNote, error: creditNoteError } = await supabase
      .from('credit_notes')
      .insert({
        user_id: user.id,
        invoice_id: body.invoice_id || null,
        client_id: body.client_id || null,
        client_name: body.client_name,
        client_email: body.client_email || null,
        client_phone: body.client_phone || null,
        client_address: body.client_address || null,
        client_siret: body.client_siret || null,
        subtotal,
        tax_rate: body.tax_rate || 20,
        tax_amount,
        total,
        status: body.status || 'draft',
        issue_date: body.issue_date,
        reason: body.reason || null,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (creditNoteError) {
      console.error('Erreur création avoir:', creditNoteError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'avoir' },
        { status: 500 }
      )
    }

    // Créer les lignes de l'avoir
    const itemsToInsert = items.map((item: any, index: number) => ({
      credit_note_id: creditNote.id,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      total: item.total,
      sort_order: index,
    }))

    const { error: itemsError } = await supabase
      .from('credit_note_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Erreur création items:', itemsError)
      // Nettoyer l'avoir créé
      await supabase.from('credit_notes').delete().eq('id', creditNote.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création des lignes de l\'avoir' },
        { status: 500 }
      )
    }

    return NextResponse.json({ creditNote }, { status: 201 })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
