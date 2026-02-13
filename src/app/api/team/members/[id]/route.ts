import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TeamMemberRow, TeamMemberPermissionsRow } from '@/types/database'

type TeamMemberWithPermissions = TeamMemberRow & {
  permissions: TeamMemberPermissionsRow[] | null
}

/**
 * GET /api/team/members/[id]
 * Récupère un membre spécifique
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
  const { data: member, error } = await (supabase as any)
    .from('team_members')
    .select(`
      *,
      permissions:team_member_permissions(*)
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .single() as { data: TeamMemberWithPermissions | null; error: any }

  if (error || !member) {
    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  }

  return NextResponse.json({
    member: {
      ...member,
      permissions: member.permissions?.[0] || null,
    },
  })
}

/**
 * PATCH /api/team/members/[id]
 * Met à jour un membre (permissions, statut, infos)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier que le membre appartient à l'utilisateur
  const { data: existingMember, error: fetchError } = await (supabase as any)
    .from('team_members')
    .select('id, owner_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single() as { data: { id: string; owner_id: string } | null; error: any }

  if (fetchError || !existingMember) {
    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  }

  const body = await request.json()
  const { permissions, ...memberData } = body

  // Mettre à jour les infos du membre si fournies
  if (Object.keys(memberData).length > 0) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'role_title', 'is_active']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in memberData) {
        updateData[field] = memberData[field]
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await (supabase as any)
        .from('team_members')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Error updating team member:', updateError)
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
      }
    }
  }

  // Mettre à jour les permissions si fournies
  if (permissions && typeof permissions === 'object') {
    const allowedPermissions = [
      'view_assigned_jobs',
      'edit_pointage',
      'view_clients',
      'create_visit_reports',
      'view_quotes',
      'edit_quotes',
      'view_invoices',
      'edit_invoices',
      'manage_technicians',
    ]

    const permissionData: Record<string, boolean> = {}
    for (const perm of allowedPermissions) {
      if (perm in permissions) {
        permissionData[perm] = Boolean(permissions[perm])
      }
    }

    if (Object.keys(permissionData).length > 0) {
      const { error: permError } = await (supabase as any)
        .from('team_member_permissions')
        .update(permissionData)
        .eq('team_member_id', id)

      if (permError) {
        console.error('Error updating permissions:', permError)
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour des permissions' },
          { status: 500 }
        )
      }
    }
  }

  // Récupérer le membre mis à jour
  const { data: updatedMember } = await (supabase as any)
    .from('team_members')
    .select(`
      *,
      permissions:team_member_permissions(*)
    `)
    .eq('id', id)
    .single() as { data: TeamMemberWithPermissions | null; error: any }

  return NextResponse.json({
    success: true,
    member: updatedMember
      ? {
          ...updatedMember,
          permissions: updatedMember.permissions?.[0] || null,
        }
      : null,
  })
}

/**
 * DELETE /api/team/members/[id]
 * Supprime un membre de l'équipe
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier que le membre appartient à l'utilisateur
  const { data: existingMember, error: fetchError } = await (supabase as any)
    .from('team_members')
    .select('id, owner_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single() as { data: { id: string; owner_id: string } | null; error: any }

  if (fetchError || !existingMember) {
    return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
  }

  // Supprimer le membre (les permissions seront supprimées en cascade)
  const { error: deleteError } = await (supabase as any)
    .from('team_members')
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting team member:', deleteError)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
