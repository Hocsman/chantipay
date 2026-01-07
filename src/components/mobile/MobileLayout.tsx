'use client';

import { ReactNode } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNavV2 } from './MobileBottomNavV2';
import { useRouter } from 'next/navigation';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export function MobileLayout({
  children,
  title = 'ChantiPay',
  subtitle,
  showHeader = true,
  showBottomNav = true,
  user,
}: MobileLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {showHeader && (
        <MobileHeader title={title} subtitle={subtitle} user={user} />
      )}

      <main
        className="overflow-y-auto"
        style={{
          paddingTop: showHeader ? '64px' : '0',
          paddingBottom: showBottomNav
            ? 'calc(80px + env(safe-area-inset-bottom))'
            : '0',
        }}
      >
        {children}
      </main>

      {showBottomNav && (
        <MobileBottomNavV2 onFabClick={() => router.push('/dashboard/quotes/new')} />
      )}
    </div>
  );
}
