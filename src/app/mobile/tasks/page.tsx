'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { EmptyState } from '@/components/mobile/EmptyState'
import { CheckSquare, Plus, Circle, CheckCircle2, Loader2, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  createdAt: string
}

const priorityColors = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const priorityLabels = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}

export default function MobileTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        const formattedTasks = (data.tasks || []).map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date,
          createdAt: task.created_at,
        }))
        setTasks(formattedTasks)
      }
    } catch (error) {
      console.error('Erreur chargement tâches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'done' ? 'todo' : 'done'
    
    // Optimistic update
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus }
      }
      return t
    }))

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error('Erreur mise à jour tâche:', error)
      // Rollback on error
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, status: task.status }
        }
        return t
      }))
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-yellow-500" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <MobileLayout title="Tâches" subtitle="Gérez vos actions à faire">
      <div className="p-4 space-y-4">
        {/* Bouton Nouvelle tâche */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => router.push('/mobile/tasks/new')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle tâche
        </Button>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes
          </Button>
          <Button
            variant={filter === 'todo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('todo')}
          >
            À faire
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in-progress')}
          >
            En cours
          </Button>
          <Button
            variant={filter === 'done' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('done')}
          >
            Terminées
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Liste des tâches */}
        {!isLoading && filteredTasks.length > 0 && (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <Card 
                key={task.id}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-all active:scale-[0.98]',
                  task.status === 'done' && 'opacity-60'
                )}
                onClick={() => router.push(`/mobile/tasks/${task.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox/Status */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTask(task.id)
                      }}
                      className="flex-shrink-0 mt-0.5"
                    >
                      {getStatusIcon(task.status)}
                    </button>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'font-medium mb-1',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority badge */}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                          {priorityLabels[task.priority]}
                        </span>

                        {/* Due date */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        )}

                        {/* Overdue indicator */}
                        {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            En retard
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredTasks.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title={filter === 'all' ? 'Aucune tâche' : `Aucune tâche ${
              filter === 'todo' ? 'à faire' : 
              filter === 'in-progress' ? 'en cours' : 
              'terminée'
            }`}
            description={filter === 'all' 
              ? 'Créez vos premières tâches pour suivre les actions importantes de vos chantiers et relances clients.'
              : 'Changez de filtre pour voir vos autres tâches.'
            }
            variant="colorful"
          />
        )}
      </div>
    </MobileLayout>
  )
}
