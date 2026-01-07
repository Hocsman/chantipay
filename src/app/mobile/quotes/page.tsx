'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { FileText } from 'lucide-react';

export default function MobileQuotesPage() {
  return (
    <MobileLayout title="Dev./Fac." subtitle="Vos devis et factures">
      <div className="p-4">
        <EmptyState
          icon={FileText}
          title="Aucun devis !"
          description="Créez votre premier devis en cliquant sur le bouton + ci-dessous."
          variant="colorful"
        />
      </div>
    </MobileLayout>
  );
}
