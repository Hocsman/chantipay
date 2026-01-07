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
        'sticky top-0 z-40 bg-primary text-white shadow-sm',
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
            <p className="text-sm text-white/80 truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 ml-3">
          <button
            className="relative p-2"
            aria-label="Chronomètre"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="13" r="8" strokeWidth="2"/>
              <path d="M12 9v4l2 2" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 2h6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <button
            className="p-2"
            aria-label="QR Code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
              <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
            </svg>
          </button>

          <Link
            href="/dashboard/notifications"
            className="relative p-2"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          </Link>

          <Link
            href="/dashboard/settings"
            className="ml-1"
            aria-label="Profil"
          >
            <Avatar className="w-9 h-9 ring-2 ring-white/30">
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
