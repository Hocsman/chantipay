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
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le devis avec les infos client
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
      .eq('user_id', user.id)
      .single()

    if (quoteError || !quote) {
      console.error('Erreur récupération devis:', quoteError)
      return NextResponse.json(
        { error: 'Devis non trouvé' },
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
