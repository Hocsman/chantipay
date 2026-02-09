'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Calendar, ChevronRight, Lightbulb } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const tabs = ['Aujourd\'hui', 'En retard', 'À venir'] as const
type Tab = typeof tabs[number]

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
}

export default function MobilePlanningPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("Aujourd'hui")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const data = await response.json()
          setTasks(data.tasks || [])
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  // Filtrer les tâches selon l'onglet actif
  const today = new Date().toISOString().split('T')[0]

  const todayTasks = tasks.filter(t => t.due_date === today && t.status !== 'done')
  const lateTasks = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done')
  const upcomingTasks = tasks.filter(t => t.due_date && t.due_date > today && t.status !== 'done')

  const currentTasks =
    activeTab === "Aujourd'hui" ? todayTasks :
    activeTab === 'En retard' ? lateTasks :
    upcomingTasks

  const getStatusBadge = (status: string, priority: string) => {
    if (status === 'done') {
      return { label: 'Terminée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    }
    if (status === 'in-progress') {
      return { label: 'En cours', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    }
    // Status todo - couleur selon priorité
    switch (priority) {
      case 'high':
        return { label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
      case 'medium':
        return { label: 'Moyenne', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
      case 'low':
        return { label: 'Basse', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
      default:
        return { label: 'À faire', color: 'bg-muted text-muted-foreground' }
    }
  }

  return (
    <MobileLayout title="Planning" subtitle="Organisez vos tâches">
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
              Planifiez vos tâches à l'avance pour optimiser votre journée
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
          ) : currentTasks.length === 0 ? (
            <>
              {activeTab === "Aujourd'hui" && (
                <EmptyState
                  icon={Calendar}
                  title="Aucune tâche aujourd'hui"
                  description="Profitez de cette journée pour préparer vos prochains chantiers ou contacter vos prospects."
                  variant="colorful"
                />
              )}

              {activeTab === 'En retard' && (
                <EmptyState
                  icon={Calendar}
                  title="Tout est à jour !"
                  description="Excellent ! Toutes vos tâches sont à jour."
                  variant="colorful"
                />
              )}

              {activeTab === 'À venir' && (
                <EmptyState
                  icon={Calendar}
                  title="Aucune tâche planifiée"
                  description="Commencez à planifier vos prochaines tâches pour mieux organiser votre semaine."
                  variant="colorful"
                />
              )}
            </>
          ) : (
            <div className="space-y-3">
              {currentTasks.map((task) => {
                const statusInfo = getStatusBadge(task.status, task.priority)
                return (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    className="bg-card rounded-xl p-4 shadow-sm border transition-transform active:scale-98"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span className={cn('rounded-full px-3 py-1 text-xs font-medium ml-2', statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {task.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(task.due_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* FAB pour créer une tâche */}
      <FloatingActionButton
        href="/mobile/tasks/new"
        label="Nouvelle tâche"
      />
    </MobileLayout>
  )
}
