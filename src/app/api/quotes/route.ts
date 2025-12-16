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

    // Récupérer les devis avec les infos client
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
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
      return NextResponse.json(
        { error: 'Client non trouvé' },
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

    // Générer le numéro de devis
    const quoteNumber = await generateQuoteNumber(supabase, user.id)

    // Créer le devis
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id,
        quote_number: quoteNumber,
        status: 'draft',
        total_ht: totalHT,
        total_ttc: totalTTC,
        vat_rate: vat_rate || 20,
        deposit_amount: depositAmount,
        deposit_status: 'pending',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      })
      .select()
      .single()

    if (quoteError || !quote) {
      console.error('Erreur création devis:', quoteError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du devis' },
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
        { error: 'Erreur lors de la création des lignes du devis' },
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

/**
 * Génère un numéro de devis unique
 * Format: DEV-YYYY-XXX (ex: DEV-2025-001)
 */
async function generateQuoteNumber(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `DEV-${year}-`

  // Compter les devis de l'année pour cet utilisateur
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .like('quote_number', `${prefix}%`)

  const nextNumber = (count || 0) + 1
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`
}
