import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/quotes/[id]
 * Récupère un devis spécifique avec ses lignes et infos client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Valider que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'ID de devis invalide' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log('API /api/quotes/[id] - Fetching quote ID:', id)

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('Auth result:', { userId: user?.id, authError: authError?.message })

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le devis avec les infos client
    // Note: RLS policies filtrent déjà par user_id, pas besoin de double filtre
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          address_line1,
          address_line2,
          postal_code,
          city
        )
      `)
      .eq('id', id)
      .single()

    console.log('Quote query result:', {
      quoteId: quote?.id,
      quoteUserId: quote?.user_id,
      currentUserId: user.id,
      error: quoteError?.message
    })

    if (quoteError || !quote) {
      console.error('Erreur récupération devis:', quoteError?.message, 'Code:', quoteError?.code)

      // Debug info plus détaillée
      const debugInfo = {
        requestedId: id,
        currentUserId: user.id,
        errorMessage: quoteError?.message,
        errorCode: quoteError?.code,
        hint: 'Le devis existe peut-être mais appartient à un autre utilisateur, ou les RLS policies bloquent'
      }

      console.log('Debug info:', JSON.stringify(debugInfo))

      return NextResponse.json(
        { error: 'Devis non trouvé', debug: debugInfo },
        { status: 404 }
      )
    }

    // Récupérer les lignes du devis
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Erreur récupération lignes:', itemsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des lignes du devis' },
        { status: 500 }
      )
    }

    // Combiner le devis avec ses lignes
    const fullQuote = {
      ...quote,
      items: items || []
    }

    return NextResponse.json({ quote: fullQuote })
  } catch (error) {
    console.error('Erreur API quote:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/quotes/[id]
 * Met à jour un devis existant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validation du statut
    const validStatuses = ['draft', 'sent', 'signed', 'deposit_paid', 'completed', 'canceled']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Construire les données à mettre à jour
    const updateData: Record<string, any> = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.vat_rate !== undefined) updateData.vat_rate = body.vat_rate
    if (body.deposit_percent !== undefined) updateData.deposit_percent = body.deposit_percent
    if (body.deposit_amount !== undefined) updateData.deposit_amount = body.deposit_amount
    if (body.deposit_status !== undefined) updateData.deposit_status = body.deposit_status
    if (body.deposit_paid_at !== undefined) updateData.deposit_paid_at = body.deposit_paid_at
    if (body.deposit_method !== undefined) updateData.deposit_method = body.deposit_method
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.sent_at !== undefined) updateData.sent_at = body.sent_at

    // Mettre à jour le devis
    const { data: quote, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour devis:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Si des items sont fournis, les mettre à jour
    if (body.items && Array.isArray(body.items)) {
      // Supprimer les anciennes lignes
      await supabase.from('quote_items').delete().eq('quote_id', id)

      // Insérer les nouvelles lignes
      if (body.items.length > 0) {
        const quoteItems = body.items.map((item: any, index: number) => ({
          quote_id: id,
          description: item.description,
          quantity: item.quantity || 1,
          unit_price_ht: item.unit_price_ht || 0,
          vat_rate: item.vat_rate || 20,
          sort_order: index,
        }))

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems)

        if (itemsError) {
          console.error('Erreur mise à jour items:', itemsError)
          return NextResponse.json(
            { error: itemsError.message },
            { status: 500 }
          )
        }
      }
    }

    // Récupérer le devis complet avec items
    const { data: items } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order')

    return NextResponse.json({ quote: { ...quote, items } })
  } catch (error) {
    console.error('Erreur API quote PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/quotes/[id]
 * Supprime un devis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Supprimer les items du devis (cascade devrait le faire mais sécurité)
    await supabase.from('quote_items').delete().eq('quote_id', id)

    // Supprimer le devis
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression devis:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API quote DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
