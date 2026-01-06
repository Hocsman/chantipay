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
    .slice(0, 2) || 'HM';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 md:hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-blue-100 truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-3">
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Badge notification */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-blue-600" />
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
            className="ml-1"
            aria-label="Profil"
          >
            <Avatar className="w-9 h-9 border-2 border-white/40 shadow-md">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
