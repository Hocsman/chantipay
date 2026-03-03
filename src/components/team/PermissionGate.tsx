'use client'

import { ReactNode } from 'react'
import { useTeamPermissions } from '@/hooks/useTeamPermissions'
import { PermissionKey } from '@/types/team'
import { Loader2, Lock } from 'lucide-react'

interface PermissionGateProps {
  /**
   * Permission(s) requise(s) pour afficher le contenu.
   * Si un tableau est fourni, le comportement dépend de `requireAll`.
   * Peut être omis si ownerOnly est true.
   */
  permission?: PermissionKey | PermissionKey[]

  /**
   * Si true, toutes les permissions doivent être accordées.
   * Si false (défaut), au moins une permission suffit.
   */
  requireAll?: boolean

  /**
   * Si true, réserve l'accès au patron uniquement (les membres d'équipe n'y ont pas accès).
   */
  ownerOnly?: boolean

  /**
   * Contenu à afficher si les permissions sont accordées.
   */
  children: ReactNode

  /**
   * Contenu à afficher si les permissions ne sont pas accordées.
   * Si non fourni, rien ne s'affiche.
   */
  fallback?: ReactNode

  /**
   * Contenu à afficher pendant le chargement.
   * Si non fourni, affiche un spinner.
   */
  loadingFallback?: ReactNode

  /**
   * Si true, affiche un message d'accès refusé au lieu de rien.
   */
  showAccessDenied?: boolean
}

/**
 * Composant pour afficher du contenu conditionnellement selon les permissions.
 *
 * Usage:
 * ```tsx
 * <PermissionGate permission="view_quotes">
 *   <QuotesList />
 * </PermissionGate>
 *
 * <PermissionGate ownerOnly>
 *   <BankingPage />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  requireAll = false,
  ownerOnly = false,
  children,
  fallback,
  loadingFallback,
  showAccessDenied = false,
}: PermissionGateProps) {
  const { isLoading, isTeamMember, hasAnyPermission, hasAllPermissions } = useTeamPermissions()

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )
    )
  }

  // Vérification owner-only : les membres d'équipe n'ont pas accès
  if (ownerOnly && isTeamMember) {
    if (fallback) return <>{fallback}</>
    if (showAccessDenied) return <AccessDenied />
    return null
  }

  // Vérification des permissions si spécifiées
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission]
    const hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions)

    if (!hasAccess) {
      if (fallback) return <>{fallback}</>
      if (showAccessDenied) return <AccessDenied />
      return null
    }
  }

  return <>{children}</>
}

/**
 * Composant d'accès refusé par défaut
 */
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-lg">Accès restreint</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
      </p>
    </div>
  )
}

/**
 * HOC pour protéger une page entière
 *
 * Usage:
 * ```tsx
 * function QuotesPage() { return <div>...</div> }
 * export default withPermission(QuotesPage, 'view_quotes')
 *
 * // Owner uniquement
 * function BankingPage() { return <div>...</div> }
 * export default withPermission(BankingPage, undefined, { ownerOnly: true })
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission?: PermissionKey | PermissionKey[],
  options?: {
    requireAll?: boolean
    fallback?: ReactNode
    ownerOnly?: boolean
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGate
        permission={permission}
        requireAll={options?.requireAll}
        ownerOnly={options?.ownerOnly}
        fallback={options?.fallback}
        showAccessDenied={!options?.fallback}
      >
        <Component {...props} />
      </PermissionGate>
    )
  }
}
