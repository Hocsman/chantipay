import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabaseClient'
import { TeamMemberRow } from '@/types/database'

/**
 * GET /api/team/accept/[token]
 * Récupère les détails d'une invitation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const adminClient = await getSupabaseAdminClient()

  // Récupérer l'invitation avec les infos du propriétaire
  // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
  const { data: invitation, error } = await (adminClient as any)
    .from('team_members')
    .select(`
      id,
      email,
      first_name,
      last_name,
      role_title,
      invitation_status,
      expires_at,
      owner_id
    `)
    .eq('invitation_token', token)
    .single() as { data: Pick<TeamMemberRow, 'id' | 'email' | 'first_name' | 'last_name' | 'role_title' | 'invitation_status' | 'expires_at' | 'owner_id'> | null; error: any }

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 })
  }

  if (invitation.invitation_status !== 'pending') {
    return NextResponse.json(
      { error: 'Cette invitation a déjà été utilisée ou a été révoquée' },
      { status: 400 }
    )
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    // Mettre à jour le statut en expiré
    await (adminClient as any)
      .from('team_members')
      .update({ invitation_status: 'expired' })
      .eq('id', invitation.id)

    return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 400 })
  }

  // Récupérer les infos du propriétaire
  const { data: owner } = await (adminClient as any)
    .from('profiles')
    .select('company_name, full_name')
    .eq('id', invitation.owner_id)
    .single() as { data: { company_name: string | null; full_name: string | null } | null; error: any }

  return NextResponse.json({
    invitation: {
      email: invitation.email,
      firstName: invitation.first_name,
      lastName: invitation.last_name,
      roleTitle: invitation.role_title,
      companyName: owner?.company_name || owner?.full_name || 'Une entreprise',
      ownerName: owner?.full_name,
    },
  })
}

/**
 * POST /api/team/accept/[token]
 * Accepte une invitation (l'utilisateur doit être connecté)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  const adminClient = await getSupabaseAdminClient()

  // Vérifier si l'utilisateur est connecté
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Vous devez être connecté pour accepter l\'invitation' },
      { status: 401 }
    )
  }

  // Récupérer l'invitation
  // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
  const { data: invitation, error: invError } = await (adminClient as any)
    .from('team_members')
    .select('*')
    .eq('invitation_token', token)
    .single() as { data: TeamMemberRow | null; error: any }

  if (invError || !invitation) {
    return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 })
  }

  if (invitation.invitation_status !== 'pending') {
    return NextResponse.json(
      { error: 'Cette invitation a déjà été utilisée ou a été révoquée' },
      { status: 400 }
    )
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await (adminClient as any)
      .from('team_members')
      .update({ invitation_status: 'expired' })
      .eq('id', invitation.id)

    return NextResponse.json({ error: 'Cette invitation a expiré' }, { status: 400 })
  }

  // Vérifier que l'email correspond
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `Veuillez vous connecter avec l'adresse email invitée : ${invitation.email}`,
        expectedEmail: invitation.email,
      },
      { status: 400 }
    )
  }

  // Vérifier que l'utilisateur n'est pas déjà membre d'une autre équipe
  const { data: existingMembership } = await (adminClient as any)
    .from('team_members')
    .select('id, owner_id')
    .eq('member_user_id', user.id)
    .eq('invitation_status', 'accepted')
    .eq('is_active', true)
    .single() as { data: { id: string; owner_id: string } | null; error: any }

  if (existingMembership) {
    return NextResponse.json(
      { error: 'Vous êtes déjà membre d\'une équipe. Contactez votre administrateur.' },
      { status: 400 }
    )
  }

  // Accepter l'invitation
  const { error: updateError } = await (adminClient as any)
    .from('team_members')
    .update({
      member_user_id: user.id,
      invitation_status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id)

  if (updateError) {
    console.error('Error accepting invitation:', updateError)
    return NextResponse.json(
      { error: 'Erreur lors de l\'acceptation de l\'invitation' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    redirect: '/mobile', // Les membres d'équipe utilisent l'interface mobile
  })
}
