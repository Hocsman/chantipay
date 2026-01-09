'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, Settings, Receipt, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: Home,
  },
  {
    href: '/dashboard/clients',
    label: 'Clients',
    icon: Users,
  },
  {
    href: '/dashboard/quotes',
    label: 'Devis',
    icon: FileText,
  },
  {
    href: '/dashboard/invoices',
    label: 'Factures',
    icon: Receipt,
  },
  {
    href: '/dashboard/avoirs',
    label: 'Avoirs',
    icon: TrendingDown,
  },
  {
    href: '/dashboard/settings',
    label: 'Paramètres',
    icon: Settings,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg fixed bottom-0 left-0 right-0 z-50 border-t md:hidden">
      {/* Container avec safe-area pour iPhone */}
      <div 
        className="flex items-center justify-around"
        style={{ 
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 text-xs font-medium transition-colors active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:text-foreground'
              )}
            >
              <item.icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
              <span className="truncate max-w-[72px] text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
