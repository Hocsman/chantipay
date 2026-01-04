'use client';

import { useState } from 'react';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { CreateActionSheet } from './CreateActionSheet';
import { cn } from '@/lib/utils';

interface MobileAppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  className?: string;
}

export function MobileAppShell({
  children,
  title,
  subtitle,
  user,
  className,
}: MobileAppShellProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  return (
    <>
      {/* Mobile-only shell */}
      <div className="md:hidden min-h-screen bg-gray-50">
        <MobileHeader title={title} subtitle={subtitle} user={user} />

        <main
          className={cn('overflow-y-auto', className)}
          style={{
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </main>

        <MobileBottomNav onFabClick={() => setCreateSheetOpen(true)} />
      </div>

      {/* Desktop: render children without shell */}
      <div className="hidden md:block">{children}</div>

      {/* Action Sheet */}
      <CreateActionSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
      />
    </>
  );
}
