import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TeamMemberRow, TeamMemberPermissionsRow } from '@/types/database'

type TeamMemberWithPermissions = TeamMemberRow & {
  permissions: TeamMemberPermissionsRow[] | null
}

/**
 * GET /api/team/members
 * Liste les membres de l'équipe du propriétaire connecté
 */
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Récupérer les membres avec leurs permissions
  // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
  const { data: members, error } = await (supabase as any)
    .from('team_members')
    .select(`
      *,
      permissions:team_member_permissions(*)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false }) as { data: TeamMemberWithPermissions[] | null; error: any }

  if (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 })
  }

  // Transformer les données pour avoir permissions en objet simple
  const transformedMembers = (members || []).map((member) => ({
    ...member,
    permissions: member.permissions?.[0] || null,
  }))

  return NextResponse.json({ members: transformedMembers })
}
