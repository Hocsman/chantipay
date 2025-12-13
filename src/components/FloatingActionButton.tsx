'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        <Button
          size="lg"
          className="h-14 px-5 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95 gap-2"
        >
          <Plus className="h-6 w-6" />
          <span className="font-semibold">{label}</span>
        </Button>
      ) : (
        // Version icône seule
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-shadow active:scale-95"
          aria-label={label}
        >
          <Plus className="h-7 w-7" />
        </Button>
      )}
    </Link>
  );
}
