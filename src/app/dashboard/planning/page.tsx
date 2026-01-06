'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileAppShell } from '@/components/mobile/MobileAppShell';
import { Calendar, ChevronRight, Lightbulb } from 'lucide-react';
import { EmptyState } from '@/components/mobile/EmptyState';
import { cn } from '@/lib/utils';

const tabs = ['Aujourd\'hui', 'En retard', 'À venir'] as const;
type Tab = typeof tabs[number];

export default function PlanningPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Aujourd'hui");

  return (
    <MobileAppShell title="Planning" subtitle="Organisez vos interventions">
      <div className="p-4 space-y-4">
        {/* Calendar CTA Card */}
        <button
          onClick={() => router.push('/dashboard/calendar')}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Accéder au calendrier</p>
              <p className="text-sm text-gray-500">Vue mensuelle complète</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Tips Banner (optional) */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Conseil du jour
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Planifiez vos interventions à l'avance pour optimiser vos déplacements
            </p>
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl inline-flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all',
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {activeTab === "Aujourd'hui" && (
            <EmptyState
              icon={Calendar}
              title="Aucune intervention aujourd'hui"
              description="Profitez de cette journée pour préparer vos prochains chantiers ou contacter vos prospects."
              action={{
                label: 'Planifier une intervention',
                onClick: () => router.push('/dashboard/planning/new'),
              }}
              variant="colorful"
            />
          )}

          {activeTab === 'En retard' && (
            <EmptyState
              icon={Calendar}
              title="Tout est à jour !"
              description="Excellent ! Toutes vos interventions sont à jour."
              variant="colorful"
            />
          )}

          {activeTab === 'À venir' && (
            <EmptyState
              icon={Calendar}
              title="Aucune intervention planifiée"
              description="Commencez à planifier vos prochaines interventions pour mieux organiser votre semaine."
              action={{
                label: 'Planifier une intervention',
                onClick: () => router.push('/dashboard/planning/new'),
              }}
              variant="colorful"
            />
          )}
        </div>
      </div>
    </MobileAppShell>
  );
}
