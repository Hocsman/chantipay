'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  href: string;
  label?: string;
}

export function FloatingActionButton({
  href,
  label = 'Nouveau',
}: FloatingActionButtonProps) {
  return (
    <Link 
      href={href} 
      className="fixed bottom-24 right-4 z-40 md:hidden"
      aria-label={label}
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-shadow active:scale-95"
        aria-label={label}
      >
        <Plus className="h-7 w-7" />
      </Button>
    </Link>
  );
}
