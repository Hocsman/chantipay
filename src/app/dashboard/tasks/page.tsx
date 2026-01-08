'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Loader2, Plus, CheckSquare, Circle, CheckCircle2, AlertCircle, Clock, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
}

const priorityConfig = {
  low: { label: 'Basse', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const statusConfig = {
  'todo': { label: 'À faire', icon: Circle, color: 'text-gray-500' },
  'in-progress': { label: 'En cours', icon: Clock, color: 'text-blue-500' },
  'done': { label: 'Terminée', icon: CheckCircle2, color: 'text-green-500' },
}

type FilterStatus = 'all' | 'todo' | 'in-progress' | 'done'

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des tâches')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    
    // Optimistic update
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus as Task['status'] }
          : task
      )
    )

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      const data = await response.json()
      // Update with server response
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? data.task : task
        )
      )
    } catch (error) {
      console.error('Erreur:', error)
      // Rollback on error
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: currentStatus as Task['status'] }
            : task
        )
      )
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Tâches" description="Gérez vos actions à faire" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader title="Tâches" description="Gérez vos actions à faire" />

      {/* Bouton création desktop */}
      <div className="hidden md:flex justify-end mb-6">
        <Button onClick={() => router.push('/dashboard/tasks/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({tasks.length})
        </Button>
        <Button
          variant={filter === 'todo' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('todo')}
        >
          À faire ({tasks.filter(t => t.status === 'todo').length})
        </Button>
        <Button
          variant={filter === 'in-progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in-progress')}
        >
          En cours ({tasks.filter(t => t.status === 'in-progress').length})
        </Button>
        <Button
          variant={filter === 'done' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('done')}
        >
          Terminées ({tasks.filter(t => t.status === 'done').length})
        </Button>
      </div>

      {/* Liste des tâches */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune tâche</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {filter === 'all' 
                ? "Créez vos premières tâches pour suivre les actions importantes."
                : `Aucune tâche avec le statut "${statusConfig[filter as keyof typeof statusConfig]?.label}"`
              }
            </p>
            <Button onClick={() => router.push('/dashboard/tasks/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une tâche
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const StatusIcon = statusConfig[task.status].icon
            const priorityInfo = priorityConfig[task.priority]

            return (
              <Card 
                key={task.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskStatus(task.id, task.status)
                      }}
                      className="mt-0.5"
                    >
                      <StatusIcon className={cn('h-5 w-5', statusConfig[task.status].color)} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={cn(
                          'font-medium text-base',
                          task.status === 'done' && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </h3>
                        <span className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                          priorityInfo.color
                        )}>
                          {priorityInfo.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(task.due_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                        {task.completed_at && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>
                              {new Date(task.completed_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* FAB pour mobile */}
      <FloatingActionButton onClick={() => router.push('/dashboard/tasks/new')} />
    </LayoutContainer>
  )
}
