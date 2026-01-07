'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { CheckSquare } from 'lucide-react';

export default function MobileTasksPage() {
  return (
    <MobileLayout title="Tâches" subtitle="Gérez vos tâches">
      <div className="p-4">
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche !"
          description="Pour créer votre tâche, passez par le bouton + ci-dessous !"
          variant="colorful"
        />
      </div>
    </MobileLayout>
  );
}
