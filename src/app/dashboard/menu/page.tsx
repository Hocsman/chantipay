'use client';

import Link from 'next/link';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';
import {
  Users,
  Wrench,
  FileText,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: typeof Users;
  label: string;
  description?: string;
  href: string;
  badge?: string;
  color: string;
  bgColor: string;
}

const menuItems: MenuItem[] = [
  {
    icon: Users,
    label: 'Clients / Prospects',
    description: 'Gérer votre base clients',
    href: '/dashboard/clients',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Wrench,
    label: 'Chantiers / Interventions',
    description: 'Suivi des travaux',
    href: '/dashboard/planning',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: FileText,
    label: 'Factures',
    description: 'Facturation et paiements',
    href: '/dashboard/invoices',
    badge: 'Bientôt',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: CreditCard,
    label: 'Abonnement',
    description: 'Gérer mon forfait',
    href: '/dashboard/settings/billing',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Settings,
    label: 'Paramètres',
    description: "Configuration de l'app",
    href: '/dashboard/settings',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  {
    icon: HelpCircle,
    label: 'Aide & Support',
    description: "Besoin d'assistance ?",
    href: '/dashboard/help',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
];

export default function MenuPage() {
  return (
    <MobileAppShell title="Menu" subtitle="Toutes vos fonctionnalités">
      <div className="p-4 space-y-6">
        {/* Premium Banner */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-semibold">ChantiPay Pro</span>
            </div>
            <h3 className="text-lg font-bold mb-1">
              Boostez votre activité
            </h3>
            <p className="text-sm text-blue-100 mb-4">
              Devis illimités, signature électronique, et bien plus
            </p>
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center gap-1 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Découvrir Pro
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isDisabled = !!item.badge;

            return (
              <Link
                key={item.href}
                href={isDisabled ? '#' : item.href}
                className={cn(
                  'flex items-center gap-4 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors',
                  index !== 0 && 'border-t border-gray-100',
                  isDisabled && 'opacity-60 pointer-events-none'
                )}
              >
                <div className={cn('p-2.5 rounded-xl', item.bgColor)}>
                  <Icon className={cn('w-5 h-5', item.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">ChantiPay v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">
            © 2026 Tous droits réservés
          </p>
        </div>
      </div>
    </MobileAppShell>
  );
}
