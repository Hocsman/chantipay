import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/interventions/[id]
 * Récupère une intervention spécifique
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

    // Récupérer l'intervention
    const { data: intervention, error } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !intervention) {
      return NextResponse.json(
        { error: 'Intervention non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ intervention })
  } catch (error) {
    console.error('Erreur API intervention GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/interventions/[id]
 * Met à jour une intervention
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

    // Vérifier que l'intervention appartient à l'utilisateur
    const { data: existingIntervention, error: checkError } = await supabase
      .from('interventions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingIntervention) {
      return NextResponse.json(
        { error: 'Intervention non trouvée' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { 
      client_name, 
      type, 
      description, 
      address, 
      date, 
      time, 
      duration, 
      status,
      notes 
    } = body

    // Construire l'objet de mise à jour
    const updateData: any = {}
    
    if (client_name !== undefined) updateData.client_name = client_name.trim()
    if (type !== undefined) updateData.type = type.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (address !== undefined) updateData.address = address.trim()
    if (date !== undefined) updateData.date = date
    if (time !== undefined) updateData.time = time
    if (duration !== undefined) updateData.duration = duration || null
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes?.trim() || null

    // Mettre à jour l'intervention
    const { data: intervention, error } = await supabase
      .from('interventions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour intervention:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ intervention })
  } catch (error) {
    console.error('Erreur API intervention PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interventions/[id]
 * Supprime une intervention
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

    // Supprimer l'intervention
    const { error } = await supabase
      .from('interventions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression intervention:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API intervention DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
