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
