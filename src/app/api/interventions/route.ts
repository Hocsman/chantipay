import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/interventions
 * Liste toutes les interventions de l'utilisateur connecté
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

    // Récupérer les interventions
    const { data: interventions, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      console.error('Erreur récupération interventions:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des interventions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ interventions })
  } catch (error) {
    console.error('Erreur API interventions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/interventions
 * Crée une nouvelle intervention
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
    const { 
      client_id, 
      client_name, 
      type, 
      description, 
      address, 
      date, 
      time, 
      duration, 
      notes 
    } = body

    // Validation
    if (!client_name || client_name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du client est requis' },
        { status: 400 }
      )
    }

    if (!type || type.trim() === '') {
      return NextResponse.json(
        { error: 'Le type d\'intervention est requis' },
        { status: 400 }
      )
    }

    if (!address || address.trim() === '') {
      return NextResponse.json(
        { error: 'L\'adresse est requise' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'La date est requise' },
        { status: 400 }
      )
    }

    if (!time) {
      return NextResponse.json(
        { error: 'L\'heure est requise' },
        { status: 400 }
      )
    }

    // Créer l'intervention
    const { data: intervention, error } = await supabase
      .from('interventions')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        client_name: client_name.trim(),
        type: type.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        date,
        time,
        duration: duration || null,
        status: 'planned',
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création intervention:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'intervention' },
        { status: 500 }
      )
    }

    return NextResponse.json({ intervention }, { status: 201 })
  } catch (error) {
    console.error('Erreur API interventions POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
