'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Calendar, ChevronRight, Lightbulb, MapPin, Clock } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const tabs = ['Aujourd\'hui', 'En retard', 'À venir'] as const
type Tab = typeof tabs[number]

interface Intervention {
  id: string
  client_name: string
  type: string
  date: string
  time: string
  address: string
  status: string
  description?: string
}

export default function MobilePlanningPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("Aujourd'hui")
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadInterventions = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/mobile/auth')
        return
      }

      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date')
        .order('time')

      if (!error && data) {
        setInterventions(data)
      }
      setLoading(false)
    }

    loadInterventions()
  }, [router])

  // Filtrer les interventions selon l'onglet actif
  const today = new Date().toISOString().split('T')[0]
  
  const todayInterventions = interventions.filter(int => int.date === today && int.status === 'planned')
  const lateInterventions = interventions.filter(int => int.date < today && int.status !== 'completed' && int.status !== 'canceled')
  const upcomingInterventions = interventions.filter(int => int.date > today && int.status === 'planned')

  const currentInterventions = 
    activeTab === "Aujourd'hui" ? todayInterventions :
    activeTab === 'En retard' ? lateInterventions :
    upcomingInterventions

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return { label: 'Planifié', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
      case 'in-progress':
        return { label: 'En cours', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
      case 'completed':
        return { label: 'Terminé', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
      case 'canceled':
        return { label: 'Annulé', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
      default:
        return { label: status, color: 'bg-muted text-muted-foreground' }
    }
  }

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
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : currentInterventions.length === 0 ? (
            <>
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
            </>
          ) : (
            <div className="space-y-3">
              {currentInterventions.map((intervention) => {
                const statusInfo = getStatusBadge(intervention.status)
                return (
                  <div
                    key={intervention.id}
                    onClick={() => router.push(`/mobile/planning/${intervention.id}`)}
                    className="bg-card rounded-xl p-4 shadow-sm border transition-transform active:scale-98"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {intervention.client_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {intervention.type}
                        </p>
                      </div>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(intervention.date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{intervention.time.substring(0, 5)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{intervention.address}</span>
                      </div>
                    </div>

                    {intervention.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {intervention.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB pour créer une intervention */}
      <FloatingActionButton 
        href="/mobile/planning/new"
        label="Nouvelle intervention"
      />
    </MobileLayout>
  )
}
