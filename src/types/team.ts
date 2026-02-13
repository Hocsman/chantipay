/**
 * Types pour le système de gestion d'équipe
 */

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'

export interface TeamMember {
  id: string
  owner_id: string
  member_user_id: string | null
  email: string
  invitation_token: string
  invitation_status: InvitationStatus
  invited_at: string
  accepted_at: string | null
  expires_at: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  role_title: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Jointure avec permissions
  permissions?: TeamMemberPermissions
}

export interface TeamMemberPermissions {
  id: string
  team_member_id: string
  view_assigned_jobs: boolean
  edit_pointage: boolean
  view_clients: boolean
  create_visit_reports: boolean
  view_quotes: boolean
  edit_quotes: boolean
  view_invoices: boolean
  edit_invoices: boolean
  manage_technicians: boolean
  created_at: string
  updated_at: string
}

export interface TeamInvitation {
  email: string
  firstName?: string
  lastName?: string
  roleTitle?: string
  permissions: Partial<Omit<TeamMemberPermissions, 'id' | 'team_member_id' | 'created_at' | 'updated_at'>>
}

// Clés des permissions pour itération
export const PERMISSION_KEYS = [
  'view_assigned_jobs',
  'edit_pointage',
  'view_clients',
  'create_visit_reports',
  'view_quotes',
  'edit_quotes',
  'view_invoices',
  'edit_invoices',
  'manage_technicians',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

// Labels et descriptions des permissions en français
export const PERMISSION_LABELS: Record<PermissionKey, { label: string; description: string }> = {
  view_assigned_jobs: {
    label: 'Voir les tâches assignées',
    description: 'Permet de voir les interventions et tâches qui lui sont assignées',
  },
  edit_pointage: {
    label: 'Gérer son pointage',
    description: 'Permet de créer et modifier ses propres entrées de temps',
  },
  view_clients: {
    label: 'Voir les clients',
    description: 'Accès en lecture seule aux informations clients',
  },
  create_visit_reports: {
    label: 'Créer des rapports de visite',
    description: 'Permet de créer des rapports de visite technique',
  },
  view_quotes: {
    label: 'Voir les devis',
    description: 'Accès en lecture seule aux devis',
  },
  edit_quotes: {
    label: 'Gérer les devis',
    description: 'Permet de créer et modifier les devis',
  },
  view_invoices: {
    label: 'Voir les factures',
    description: 'Accès en lecture seule aux factures',
  },
  edit_invoices: {
    label: 'Gérer les factures',
    description: 'Permet de créer et modifier les factures',
  },
  manage_technicians: {
    label: 'Gérer les techniciens',
    description: 'Permet de gérer les profils techniciens',
  },
}

// Permissions par défaut pour un nouveau membre
export const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  view_assigned_jobs: true,
  edit_pointage: true,
  view_clients: false,
  create_visit_reports: false,
  view_quotes: false,
  edit_quotes: false,
  view_invoices: false,
  edit_invoices: false,
  manage_technicians: false,
}

// Contexte d'équipe pour l'utilisateur courant
export interface TeamContext {
  isOwner: boolean
  isTeamMember: boolean
  permissions: TeamMemberPermissions | null
  ownerId: string | null
  effectiveUserId: string | null
  loading: boolean
}
