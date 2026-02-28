import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/quotes/[id]/duplicate
 * Duplique un devis existant en créant un nouveau brouillon avec les mêmes données
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le devis source avec ses items
    const { data: sourceQuote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        items:quote_items (
          description,
          quantity,
          unit_price_ht,
          vat_rate,
          sort_order
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (quoteError || !sourceQuote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Créer le nouveau devis (quote_number généré par le trigger DB)
    let newQuote = null
    let insertError = null
    const maxRetries = 3

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          client_id: sourceQuote.client_id,
          status: 'draft',
          total_ht: sourceQuote.total_ht,
          total_ttc: sourceQuote.total_ttc,
          vat_rate: sourceQuote.vat_rate,
          deposit_percent: sourceQuote.deposit_percent,
          deposit_amount: sourceQuote.deposit_amount,
          deposit_status: 'pending',
          work_location: sourceQuote.work_location,
          notes: sourceQuote.notes,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      newQuote = result.data
      insertError = result.error

      const isDuplicate =
        insertError?.code === '23505' ||
        Boolean(insertError?.message?.toLowerCase().includes('duplicate key'))

      if (!insertError || !isDuplicate) break
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)))
    }

    if (insertError || !newQuote) {
      console.error('Erreur duplication devis:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la duplication' }, { status: 500 })
    }

    // Copier les items
    const items = sourceQuote.items || []
    if (items.length > 0) {
      const newItems = items.map((item: { description: string; quantity: number; unit_price_ht: number; vat_rate: number; sort_order: number }) => ({
        quote_id: newQuote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        vat_rate: item.vat_rate,
        sort_order: item.sort_order,
      }))

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(newItems)

      if (itemsError) {
        console.error('Erreur copie items:', itemsError)
        await supabase.from('quotes').delete().eq('id', newQuote.id)
        return NextResponse.json({ error: 'Erreur lors de la copie des lignes' }, { status: 500 })
      }
    }

    return NextResponse.json({
      id: newQuote.id,
      quote_number: newQuote.quote_number,
    })
  } catch (error) {
    console.error('Erreur POST /api/quotes/[id]/duplicate:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
