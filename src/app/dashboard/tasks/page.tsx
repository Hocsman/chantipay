'use client';

import { useRouter } from 'next/navigation';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';
import { CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/mobile/EmptyState';

export default function TasksPage() {
  const router = useRouter();

  return (
    <MobileAppShell title="Tâches" subtitle="Gérez vos actions à faire">
      <div className="p-4">
        <EmptyState
          icon={CheckSquare}
          title="Aucune tâche en cours"
          description="Créez des tâches pour suivre les actions importantes de vos chantiers et relances clients."
          action={{
            label: 'Créer une tâche',
            onClick: () => router.push('/dashboard/tasks/new'),
          }}
        />
      </div>
    </MobileAppShell>
  );
}
