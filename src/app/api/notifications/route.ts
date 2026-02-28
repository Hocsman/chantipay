import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications
 * Récupère les 20 dernières notifications de l'utilisateur connecté
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erreur récupération notifications:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const unreadCount = notifications?.filter(n => !n.read).length || 0

    return NextResponse.json({ notifications: notifications || [], unreadCount })
  } catch (error) {
    console.error('Erreur GET /api/notifications:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications
 * Marque des notifications comme lues
 * Body: { notificationIds: string[] } ou { markAllRead: true }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()

    if (body.markAllRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) {
        console.error('Erreur marquage notifications:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
      }
    } else if (body.notificationIds && Array.isArray(body.notificationIds)) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', body.notificationIds)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erreur marquage notifications:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur PATCH /api/notifications:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
