import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks
 * Liste toutes les tâches de l'utilisateur connecté
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

    // Récupérer les tâches
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération tâches:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des tâches' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Erreur API tasks:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Crée une nouvelle tâche
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
      title, 
      description, 
      priority = 'medium',
      status = 'todo',
      due_date,
      related_type,
      related_id
    } = body

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    // Validation de la priorité
    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priorité invalide' },
        { status: 400 }
      )
    }

    // Validation du statut
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Créer la tâche
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        due_date: due_date || null,
        related_type: related_type || null,
        related_id: related_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création tâche:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la tâche' },
        { status: 500 }
      )
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Erreur API tasks POST:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
