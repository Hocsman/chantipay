import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerTeamContext } from '@/lib/server-permissions'

/**
 * GET /api/tasks
 * - Patron : toutes les tâches de son compte
 * - Membre d'équipe : uniquement les tâches qui lui sont assignées (via son profil technicien)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const teamCtx = await getServerTeamContext(user.id)

    if (teamCtx.isTeamMember) {
      if (!teamCtx.hasPermission('view_assigned_jobs')) {
        return NextResponse.json({ tasks: [] })
      }

      // Trouver le profil technicien du membre (lié par user_id)
      const { data: techProfile } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!techProfile) {
        return NextResponse.json({ tasks: [] })
      }

      // Retourner uniquement les tâches assignées à ce technicien
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, assigned_technician:technicians(id, first_name, last_name)')
        .eq('user_id', teamCtx.effectiveUserId)
        .eq('assigned_to', techProfile.id)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération tâches membre:', error)
        return NextResponse.json({ error: 'Erreur lors de la récupération des tâches' }, { status: 500 })
      }

      return NextResponse.json({ tasks })
    }

    // Patron : toutes les tâches
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*, assigned_technician:technicians(id, first_name, last_name)')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération tâches:', error)
      return NextResponse.json({ error: 'Erreur lors de la récupération des tâches' }, { status: 500 })
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Erreur API tasks:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/tasks
 * Réservé au patron uniquement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const teamCtx = await getServerTeamContext(user.id)

    if (teamCtx.isTeamMember) {
      return NextResponse.json({ error: 'Seul le patron peut créer des tâches' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      priority = 'medium',
      status = 'todo',
      due_date,
      scheduled_time,
      assigned_to,
      related_type,
      related_id
    } = body

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json({ error: 'Priorité invalide' }, { status: 400 })
    }

    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        due_date: due_date || null,
        scheduled_time: scheduled_time || null,
        assigned_to: assigned_to || null,
        related_type: related_type || null,
        related_id: related_id || null,
      })
      .select('*, assigned_technician:technicians(id, first_name, last_name)')
      .single()

    if (error) {
      console.error('Erreur création tâche:', error)
      return NextResponse.json({ error: 'Erreur lors de la création de la tâche' }, { status: 500 })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Erreur API tasks POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
