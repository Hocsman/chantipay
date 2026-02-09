'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Button } from '@/components/ui/button'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Jours de la semaine
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Mois de l'année
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  hasEvents: boolean
}

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
}

export default function MobileCalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Charger les tâches
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true)
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

  // Obtenir le premier jour du mois
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  // Calculer les jours à afficher (incluant les jours des mois précédent/suivant)
  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Premier jour de la grille (lundi de la semaine contenant le 1er du mois)
    const startDay = new Date(firstDayOfMonth)
    const dayOfWeek = firstDayOfMonth.getDay()
    const diff = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1) // Lundi = 0
    startDay.setDate(startDay.getDate() + diff)

    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay)
      date.setDate(date.getDate() + i)

      const dateStr = date.toISOString().split('T')[0]
      const hasEvents = tasks.some(t => t.due_date === dateStr)

      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.getTime() === today.getTime(),
        hasEvents
      })
    }

    return days
  }

  const calendarDays = getCalendarDays()

  // Tâches du jour sélectionné
  const selectedDateTasks = selectedDate
    ? tasks.filter(t => t.due_date === selectedDate.toISOString().split('T')[0])
    : []

  // Navigation mois précédent/suivant
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getPriorityColor = (priority: string, status: string) => {
    if (status === 'done') return 'text-green-600 dark:text-green-400'
    if (status === 'in-progress') return 'text-orange-600 dark:text-orange-400'
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-blue-600 dark:text-blue-400'
      case 'low': return 'text-gray-600 dark:text-gray-400'
      default: return 'text-primary'
    }
  }

  return (
    <MobileLayout
      title="Calendrier"
      subtitle={`${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
    >
      <div className="p-4 space-y-4">
        {/* En-tête avec navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
            className="flex-1"
          >
            Aujourd'hui
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Grille du calendrier */}
        <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
          {/* En-tête des jours */}
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  'relative aspect-square border-b border-r p-1 text-sm transition-colors',
                  'hover:bg-muted/50 active:bg-muted',
                  !day.isCurrentMonth && 'bg-muted/20 text-muted-foreground/40',
                  day.isToday && 'bg-primary/10 font-semibold',
                  index % 7 === 6 && 'border-r-0', // Supprimer bordure droite du dimanche
                  index >= 35 && 'border-b-0' // Supprimer bordure bas dernière ligne
                )}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full',
                      day.isToday && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.hasEvents && (
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Tâches</span>
          </div>
        </div>

        {/* Tâches du jour sélectionné */}
        {selectedDate && (
          <div className="space-y-3">
            <h3 className="font-semibold">
              Tâches du {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </h3>
            {loading ? (
              <div className="bg-muted/30 rounded-xl p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : selectedDateTasks.length === 0 ? (
              <div className="bg-muted/30 rounded-xl p-4 text-center text-sm text-muted-foreground">
                Aucune tâche prévue ce jour
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                    className="bg-card rounded-xl p-4 shadow-sm border transition-transform active:scale-98"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <span className={cn('text-sm font-medium', getPriorityColor(task.priority, task.status))}>
                        {task.status === 'done' ? '✓' : task.priority === 'high' ? '!' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB pour créer une tâche */}
      <FloatingActionButton
        href="/mobile/tasks/new"
        label="Nouvelle tâche"
      />
    </MobileLayout>
  )
}
