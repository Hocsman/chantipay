import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks/[id]
 * Récupère une tâche spécifique
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

    // Récupérer la tâche
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !task) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Erreur API task GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Met à jour une tâche
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

    // Vérifier que la tâche appartient à l'utilisateur
    const { data: existingTask, error: checkError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existingTask) {
      return NextResponse.json(
        { error: 'Tâche non trouvée' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      priority,
      status,
      due_date,
      related_type,
      related_id
    } = body

    // Construire l'objet de mise à jour
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return NextResponse.json(
          { error: 'Priorité invalide' },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }
    if (status !== undefined) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        return NextResponse.json(
          { error: 'Statut invalide' },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    if (due_date !== undefined) updateData.due_date = due_date || null
    if (related_type !== undefined) updateData.related_type = related_type || null
    if (related_id !== undefined) updateData.related_id = related_id || null

    // Mettre à jour la tâche
    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour tâche:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Erreur API task PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Supprime une tâche
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

    // Supprimer la tâche
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression tâche:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API task DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
