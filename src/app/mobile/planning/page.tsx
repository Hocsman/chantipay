'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Calendar, ChevronRight, Lightbulb } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'
import { cn } from '@/lib/utils'

const tabs = ['Aujourd\'hui', 'En retard', 'À venir'] as const
type Tab = typeof tabs[number]

export default function MobilePlanningPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("Aujourd'hui")

  return (
    <MobileLayout title="Planning" subtitle="Organisez vos interventions">
      <div className="p-4 space-y-4">
        {/* Accès rapide au calendrier */}
        <button
          onClick={() => router.push('/mobile/planning/calendar')}
          className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-4 flex items-center justify-between shadow-sm border border-blue-100 dark:border-blue-900/30 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Accéder au calendrier</p>
              <p className="text-sm text-muted-foreground">Vue mensuelle complète</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Conseil du jour */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Conseil du jour
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Planifiez vos interventions à l'avance pour optimiser vos déplacements
            </p>
          </div>
        </div>

        {/* Onglets segmentés */}
        <div className="bg-muted p-1 rounded-xl inline-flex w-full">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 px-3 text-sm font-medium rounded-lg transition-all',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="min-h-[300px]">
          {activeTab === "Aujourd'hui" && (
            <EmptyState
              icon={Calendar}
              title="Aucune intervention aujourd'hui"
              description="Profitez de cette journée pour préparer vos prochains chantiers ou contacter vos prospects."
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
              variant="colorful"
            />
          )}
        </div>
      </div>
    </MobileLayout>
  )
}
