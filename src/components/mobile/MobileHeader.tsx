'use client';

import Link from 'next/link';
import { Bell, HelpCircle, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  className?: string;
}

export function MobileHeader({ title, subtitle, user, className }: MobileHeaderProps) {
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 md:hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md',
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-blue-100 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 ml-3">
          <Link
            href="/dashboard/notifications"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </Link>

          <Link
            href="/dashboard/help"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Aide"
          >
            <HelpCircle className="w-5 h-5" />
          </Link>

          <Link
            href="/dashboard/settings"
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <Link
            href="/dashboard/settings/profile"
            className="ml-1"
            aria-label="Profil"
          >
            <Avatar className="w-8 h-8 border-2 border-white/30">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
