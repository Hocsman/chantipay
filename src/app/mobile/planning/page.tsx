'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { Calendar } from 'lucide-react';

export default function MobilePlanningPage() {
  return (
    <MobileLayout title="Planning" subtitle="Votre planning de chantiers">
      <div className="p-4">
        <EmptyState
          icon={Calendar}
          title="Planning vide !"
          description="Aucun événement planifié pour le moment."
          variant="colorful"
        />
      </div>
    </MobileLayout>
  );
}
