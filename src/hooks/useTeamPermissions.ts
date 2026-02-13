'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PermissionKey, TeamMemberPermissions, DEFAULT_PERMISSIONS } from '@/types/team'

interface TeamPermissionsState {
  isLoading: boolean
  isTeamMember: boolean
  ownerId: string | null
  permissions: TeamMemberPermissions | null
}

interface UseTeamPermissionsReturn extends TeamPermissionsState {
  hasPermission: (permission: PermissionKey) => boolean
  hasAnyPermission: (...permissions: PermissionKey[]) => boolean
  hasAllPermissions: (...permissions: PermissionKey[]) => boolean
  refresh: () => Promise<void>
}

/**
 * Hook pour vérifier les permissions d'un membre d'équipe
 *
 * Usage:
 * ```tsx
 * const { hasPermission, isTeamMember, isLoading } = useTeamPermissions()
 *
 * if (isLoading) return <Spinner />
 *
 * if (hasPermission('view_quotes')) {
 *   // Afficher les devis
 * }
 * ```
 */
export function useTeamPermissions(): UseTeamPermissionsReturn {
  const [state, setState] = useState<TeamPermissionsState>({
    isLoading: true,
    isTeamMember: false,
    ownerId: null,
    permissions: null,
  })

  const loadPermissions = useCallback(async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({
          isLoading: false,
          isTeamMember: false,
          ownerId: null,
          permissions: null,
        })
        return
      }

      // Vérifier si l'utilisateur est membre d'une équipe
      const { data: membership, error } = await supabase
        .from('team_members')
        .select(`
          id,
          owner_id,
          permissions:team_member_permissions(*)
        `)
        .eq('member_user_id', user.id)
        .eq('invitation_status', 'accepted')
        .eq('is_active', true)
        .single()

      if (error || !membership) {
        // L'utilisateur n'est pas membre d'une équipe (il est probablement owner)
        setState({
          isLoading: false,
          isTeamMember: false,
          ownerId: null,
          permissions: null,
        })
        return
      }

      // L'utilisateur est membre d'une équipe
      const perms = membership.permissions?.[0] as TeamMemberPermissions | undefined

      setState({
        isLoading: false,
        isTeamMember: true,
        ownerId: membership.owner_id,
        permissions: perms || null,
      })
    } catch (error) {
      console.error('Erreur chargement permissions:', error)
      setState({
        isLoading: false,
        isTeamMember: false,
        ownerId: null,
        permissions: null,
      })
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Vérifier une permission spécifique
  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      // Si pas membre d'équipe, on assume que c'est un owner avec tous les droits
      if (!state.isTeamMember) {
        return true
      }

      // Sinon vérifier la permission
      return state.permissions?.[permission] ?? false
    },
    [state.isTeamMember, state.permissions]
  )

  // Vérifier si au moins une permission est accordée
  const hasAnyPermission = useCallback(
    (...permissions: PermissionKey[]): boolean => {
      return permissions.some((perm) => hasPermission(perm))
    },
    [hasPermission]
  )

  // Vérifier si toutes les permissions sont accordées
  const hasAllPermissions = useCallback(
    (...permissions: PermissionKey[]): boolean => {
      return permissions.every((perm) => hasPermission(perm))
    },
    [hasPermission]
  )

  return {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: loadPermissions,
  }
}

/**
 * Hook pour obtenir l'ID effectif de l'utilisateur
 * (owner_id si membre d'équipe, sinon l'ID de l'utilisateur courant)
 */
export function useEffectiveUserId(): {
  isLoading: boolean
  userId: string | null
  isTeamMember: boolean
} {
  const [state, setState] = useState<{
    isLoading: boolean
    userId: string | null
    isTeamMember: boolean
  }>({
    isLoading: true,
    userId: null,
    isTeamMember: false,
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ isLoading: false, userId: null, isTeamMember: false })
        return
      }

      // Vérifier si membre d'équipe
      const { data: membership } = await supabase
        .from('team_members')
        .select('owner_id')
        .eq('member_user_id', user.id)
        .eq('invitation_status', 'accepted')
        .eq('is_active', true)
        .single()

      if (membership) {
        setState({
          isLoading: false,
          userId: membership.owner_id,
          isTeamMember: true,
        })
      } else {
        setState({
          isLoading: false,
          userId: user.id,
          isTeamMember: false,
        })
      }
    }

    load()
  }, [])

  return state
}
