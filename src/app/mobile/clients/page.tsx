'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { Users } from 'lucide-react';

export default function MobileClientsPage() {
  return (
    <MobileLayout title="Clients" subtitle="Gérez vos clients et prospects">
      <div className="p-4">
        <EmptyState
          icon={Users}
          title="Aucun client !"
          description="Créez votre premier client pour commencer à générer des devis."
          variant="colorful"
        />
      </div>
    </MobileLayout>
  );
}
