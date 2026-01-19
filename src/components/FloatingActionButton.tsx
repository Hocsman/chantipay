'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  href: string;
  label?: string;
  showLabel?: boolean;
}

export function FloatingActionButton({
  href,
  label = 'Nouveau devis',
  showLabel = true,
}: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      className="fixed bottom-24 right-4 z-40 md:hidden"
      aria-label={label}
    >
      {showLabel ? (
        // Version avec label (plus intuitive)
        <button
          className="inline-flex items-center gap-2 h-14 px-6 rounded-full font-semibold text-white bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ) : (
        // Version icône seule
        <button
          className="h-14 w-14 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label={label}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </Link>
  );
}
