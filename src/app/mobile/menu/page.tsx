'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building,
  Calendar,
  Package,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MobileMenuPage() {
  const router = useRouter();

  const menuItems = [
    {
      label: 'Clients / Prospects',
      icon: Users,
      href: '/dashboard/clients',
    },
    {
      label: 'Fournisseurs',
      icon: Building,
      href: '/dashboard/suppliers',
    },
    {
      label: 'Chantiers',
      icon: Calendar,
      href: '/dashboard/projects',
    },
    {
      label: 'Stocks',
      icon: Package,
      href: '/dashboard/inventory',
    },
  ];

  return (
    <MobileLayout title="Menu" subtitle="Retrouvez ici les autres menus auxquels vous avez accès.">
      <div className="space-y-3 p-4">
        {menuItems.map((item) => {
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
        })}
      </div>
    </MobileLayout>
  );
}
