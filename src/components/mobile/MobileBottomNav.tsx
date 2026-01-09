'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CheckSquare, FileText, Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: typeof Calendar;
  href: string;
  match?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Planning',
    icon: Calendar,
    href: '/mobile/dashboard',
    match: ['/mobile/dashboard', '/mobile/planning'],
  },
  {
    label: 'Tâches',
    icon: CheckSquare,
    href: '/mobile/tasks',
    match: ['/mobile/tasks'],
  },
  {
    label: 'Devis',
    icon: FileText,
    href: '/mobile/quotes',
    match: ['/mobile/quotes', '/mobile/factures', '/mobile/avoirs'],
  },
  {
    label: 'Menu',
    icon: Menu,
    href: '/mobile/menu',
    match: ['/mobile/menu', '/mobile/settings', '/mobile/clients'],
  },
];

interface MobileBottomNavProps {
  onFabClick?: () => void;
}

export function MobileBottomNav({ onFabClick }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.match) {
      return item.match.some((path) => pathname?.startsWith(path));
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-lg"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1 relative">
        {/* First 2 items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-colors',
                active
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-1', active && 'stroke-[2.5]')} />
              <span className={cn('text-xs', active && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onFabClick}
            className="w-14 h-14 -mt-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all"
            aria-label="Créer"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Last 2 items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-xl transition-colors',
                active
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-1', active && 'stroke-[2.5]')} />
              <span className={cn('text-xs', active && 'font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
