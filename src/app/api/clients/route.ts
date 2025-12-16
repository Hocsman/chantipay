import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/clients
 * Liste tous les clients de l'utilisateur connecté
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

    // Récupérer les clients
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erreur récupération clients:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des clients' },
        { status: 500 }
      )
    }

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Erreur API clients:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clients
 * Crée un nouveau client
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
    const { name, phone, email, address_line1, postal_code, city, notes } = body

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du client est requis' },
        { status: 400 }
      )
    }

    // Créer le client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address_line1: address_line1?.trim() || null,
        postal_code: postal_code?.trim() || null,
        city: city?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création client:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création du client' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      client,
    })
  } catch (error) {
    console.error('Erreur API clients POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
