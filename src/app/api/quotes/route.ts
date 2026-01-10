import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/quotes
 * Liste tous les devis de l'utilisateur connecté
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les devis avec les infos client et les items
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        ),
        items:quote_items (
          id,
          description,
          quantity,
          unit_price_ht
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération devis:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des devis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Erreur API quotes:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotes
 * Crée un nouveau devis avec ses lignes
 */
export async function POST(request: NextRequest) {
  try {
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
    const { client_id, vat_rate, deposit_percent, items } = body

    // Validation
    if (!client_id) {
      return NextResponse.json(
        { error: 'Le client est requis' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une ligne de devis est requise' },
        { status: 400 }
      )
    }

    // Vérifier que le client appartient à l'utilisateur
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      console.error('Client non trouvé:', clientError)
      return NextResponse.json(
        { error: `Client non trouvé: ${clientError?.message || 'ID invalide'}` },
        { status: 404 }
      )
    }

    // Calculer les totaux
    let totalHT = 0
    let totalVAT = 0

    items.forEach((item: { quantity: number; unit_price_ht: number; vat_rate: number }) => {
      const lineHT = item.quantity * item.unit_price_ht
      const lineVAT = lineHT * (item.vat_rate / 100)
      totalHT += lineHT
      totalVAT += lineVAT
    })

    const totalTTC = totalHT + totalVAT
    const depositAmount = totalTTC * ((deposit_percent || 30) / 100)

    // Le quote_number sera généré automatiquement par le trigger
    // On n'a plus besoin de l'appeler manuellement

    // Créer le devis
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id,
        // quote_number sera auto-généré par le trigger
        status: 'draft',
        total_ht: totalHT,
        total_ttc: totalTTC,
        vat_rate: vat_rate || 20,
        deposit_percent: deposit_percent || 30,
        deposit_amount: depositAmount,
        deposit_status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      })
      .select()
      .single()

    if (quoteError || !quote) {
      console.error('Erreur création devis:', quoteError)
      return NextResponse.json(
        { error: `Erreur lors de la création du devis: ${quoteError?.message || 'Unknown'}` },
        { status: 500 }
      )
    }

    // Créer les lignes du devis
    const quoteItems = items.map((item: { description: string; quantity: number; unit_price_ht: number; vat_rate: number }, index: number) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
      sort_order: index,
    }))

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(quoteItems)

    if (itemsError) {
      console.error('Erreur création lignes devis:', itemsError)
      // Supprimer le devis créé en cas d'erreur
      await supabase.from('quotes').delete().eq('id', quote.id)
      return NextResponse.json(
        { error: `Erreur lors de la création des lignes: ${itemsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        quote_number: quote.quote_number,
      },
    })
  } catch (error) {
    console.error('Erreur API quotes POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
