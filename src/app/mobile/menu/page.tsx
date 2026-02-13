'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import {
  Users,
  Users2,
  Calendar,
  Receipt,
  ClipboardList,
  Landmark,
  Bell,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTeamPermissions } from '@/hooks/useTeamPermissions';
import { PermissionKey } from '@/types/team';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href: string;
  /**
   * Permission(s) requise(s) pour voir cet élément.
   * Si null/undefined, visible par tous.
   * Si tableau, une seule permission suffit.
   */
  permissions?: PermissionKey | PermissionKey[];
  /**
   * Si true, visible uniquement pour les owners (pas pour les membres d'équipe)
   */
  ownerOnly?: boolean;
}

export default function MobileMenuPage() {
  const router = useRouter();
  const { isLoading, isTeamMember, hasAnyPermission } = useTeamPermissions();

  const menuItems: MenuItem[] = [
    {
      label: 'Clients / Prospects',
      icon: Users,
      href: '/mobile/clients',
      permissions: 'view_clients',
    },
    {
      label: 'Factures',
      icon: Receipt,
      href: '/mobile/factures',
      permissions: ['view_invoices', 'edit_invoices'],
    },
    {
      label: 'Avoirs',
      icon: Receipt,
      href: '/mobile/avoirs',
      permissions: ['view_invoices', 'edit_invoices'],
    },
    {
      label: 'Relances',
      icon: Bell,
      href: '/mobile/relances',
      ownerOnly: true, // Seul le patron peut gérer les relances
    },
    {
      label: 'Techniciens',
      icon: Users2,
      href: '/mobile/technicians',
      permissions: 'manage_technicians',
    },
    {
      label: 'Rapports de visite',
      icon: ClipboardList,
      href: '/mobile/visit-reports',
      permissions: 'create_visit_reports',
    },
    {
      label: 'Bancaire',
      icon: Landmark,
      href: '/mobile/banking',
      ownerOnly: true, // Seul le patron a accès au bancaire
    },
    {
      label: 'Chantiers',
      icon: Calendar,
      href: '/mobile/planning',
      permissions: 'view_assigned_jobs',
    },
  ];

  // Filtrer les éléments selon les permissions
  const visibleItems = menuItems.filter((item) => {
    // Si ownerOnly et l'utilisateur est membre d'équipe, cacher
    if (item.ownerOnly && isTeamMember) {
      return false;
    }

    // Si pas de permissions requises, afficher
    if (!item.permissions) {
      return true;
    }

    // Vérifier les permissions (les owners ont toujours accès)
    const perms = Array.isArray(item.permissions) ? item.permissions : [item.permissions];
    return hasAnyPermission(...perms);
  });

  if (isLoading) {
    return (
      <MobileLayout title="Menu" subtitle="Chargement...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Menu" subtitle="Retrouvez ici les autres menus auxquels vous avez accès.">
      <div className="space-y-3 p-4">
        {visibleItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucun menu disponible avec vos permissions actuelles.</p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-transform active:scale-98"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                  <Icon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">
                  {item.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
