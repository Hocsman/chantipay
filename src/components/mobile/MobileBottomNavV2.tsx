'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, FileText, Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavV2Props {
  onFabClick?: () => void;
}

const navItems = [
  {
    href: '/mobile/dashboard',
    label: 'Planning',
    icon: Home,
  },
  {
    href: '/mobile/tasks',
    label: 'Tâches',
    icon: CheckSquare,
  },
  {
    href: '/mobile/quotes',
    label: 'Dev./Fac.',
    icon: FileText,
  },
  {
    href: '/mobile/menu',
    label: 'Menu',
    icon: Menu,
  },
];

export function MobileBottomNavV2({ onFabClick }: MobileBottomNavV2Props) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-lg">
      <div
        className="flex items-center justify-around relative"
        style={{
          height: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {navItems.map((item, index) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <div key={item.href} className="flex flex-1 items-center justify-center">
              {/* Spacer for FAB */}
              {index === 2 && (
                <div className="w-16" />
              )}
              
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </div>
          );
        })}

        {/* FAB Button */}
        <button
          onClick={onFabClick}
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
