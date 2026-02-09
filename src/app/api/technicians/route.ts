import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/technicians
 * Liste tous les techniciens de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: technicians, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('user_id', user.id)
      .order('first_name', { ascending: true })

    if (error) {
      console.error('Erreur récupération techniciens:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ technicians })
  } catch (error) {
    console.error('Erreur API technicians:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/technicians
 * Crée un nouveau technicien
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, specialties, notes } = body

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Prénom et nom requis' }, { status: 400 })
    }

    const { data: technician, error } = await supabase
      .from('technicians')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        specialties: specialties || [],
        notes: notes || null,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création technicien:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ technician }, { status: 201 })
  } catch (error) {
    console.error('Erreur API technicians POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
