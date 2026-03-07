import { createClient } from '@/lib/supabase/server'
import { PermissionKey } from '@/types/team'

export interface ServerTeamContext {
  isOwner: boolean
  isTeamMember: boolean
  /** ID effectif : owner_id pour les membres, user.id pour les patrons */
  effectiveUserId: string
  /** ID réel de l'utilisateur connecté */
  userId: string
  hasPermission: (permission: PermissionKey) => boolean
}

/**
 * Résout le contexte d'équipe pour l'utilisateur authentifié.
 * À utiliser dans les API routes pour la défense en profondeur.
 *
 * - Si l'utilisateur est un membre d'équipe → effectiveUserId = owner_id
 * - Si l'utilisateur est un patron → effectiveUserId = user.id, toutes les permissions accordées
 */
export async function getServerTeamContext(userId: string): Promise<ServerTeamContext> {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('team_members')
    .select('owner_id, team_member_permissions(*)')
    .eq('member_user_id', userId)
    .eq('invitation_status', 'accepted')
    .eq('is_active', true)
    .maybeSingle()

  if (!membership) {
    return {
      isOwner: true,
      isTeamMember: false,
      effectiveUserId: userId,
      userId,
      hasPermission: () => true,
    }
  }

  const perms = (membership.team_member_permissions as Record<string, boolean>[] | null)?.[0] ?? {}

  return {
    isOwner: false,
    isTeamMember: true,
    effectiveUserId: membership.owner_id,
    userId,
    hasPermission: (permission: PermissionKey) => Boolean(perms[permission] ?? false),
  }
}
