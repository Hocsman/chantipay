'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, ArrowLeft, Calendar, Trash2, Save, CheckCircle2, Circle, Clock } from 'lucide-react'
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
  low: { label: 'Basse', emoji: '🟢', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  medium: { label: 'Moyenne', emoji: '🔵', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'Haute', emoji: '🔴', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const statusConfig = {
  'todo': { label: 'À faire', icon: Circle, color: 'text-gray-500' },
  'in-progress': { label: 'En cours', icon: Clock, color: 'text-blue-500' },
  'done': { label: 'Terminée', icon: CheckCircle2, color: 'text-green-500' },
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadTask(p.id)
    })
  }, [])

  const loadTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const data = await response.json()
        setTask(data.task)
      } else {
        toast.error('Tâche non trouvée')
        router.push('/dashboard/tasks')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!task) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      const data = await response.json()
      setTask(data.task)
      toast.success('✅ Tâche mise à jour')
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('✅ Tâche supprimée')
      router.push('/dashboard/tasks')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const toggleTaskStatus = async () => {
    if (!task) return

    const newStatus = task.status === 'done' ? 'todo' : 'done'
    const previousTask = { ...task }

    // Optimistic update
    setTask({ ...task, status: newStatus })

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      setTask(data.task)
      toast.success(newStatus === 'done' ? '✅ Tâche terminée' : '↩️ Tâche réouverte')
    } catch (error) {
      // Rollback
      setTask(previousTask)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Tâche" description="Chargement..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!task) {
    return null
  }

  const StatusIcon = statusConfig[task.status].icon

  return (
    <LayoutContainer>
      <PageHeader title="Tâche" description={task.title} />

      <div className="max-w-4xl space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Toggle rapide done/todo */}
        {!isEditing && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className={cn('h-6 w-6', statusConfig[task.status].color)} />
                  <div>
                    <p className="font-medium">{statusConfig[task.status].label}</p>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Terminée le {new Date(task.completed_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={toggleTaskStatus}
                  variant={task.status === 'done' ? 'outline' : 'default'}
                  size="sm"
                >
                  {task.status === 'done' ? (
                    <>
                      <Circle className="mr-2 h-4 w-4" />
                      Rouvrir
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marquer terminée
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          )}
        </div>

        {/* Informations */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Titre */}
              <div className="space-y-2">
                <Label>Titre</Label>
                {isEditing ? (
                  <Input
                    value={task.title}
                    onChange={(e) => setTask({ ...task, title: e.target.value })}
                    placeholder="Titre de la tâche"
                  />
                ) : (
                  <p className="text-lg font-medium">{task.title}</p>
                )}
              </div>

              {/* Description */}
              {(task.description || isEditing) && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={task.description || ''}
                      onChange={(e) => setTask({ ...task, description: e.target.value })}
                      rows={4}
                      placeholder="Détails de la tâche..."
                    />
                  ) : (
                    <p className="text-base whitespace-pre-wrap">{task.description}</p>
                  )}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* Priorité */}
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  {isEditing ? (
                    <Select
                      value={task.priority}
                      onValueChange={(value: any) => setTask({ ...task, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Basse</SelectItem>
                        <SelectItem value="medium">🔵 Moyenne</SelectItem>
                        <SelectItem value="high">🔴 Haute</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium px-3 py-1.5 rounded-full',
                        priorityConfig[task.priority].color
                      )}>
                        {priorityConfig[task.priority].emoji} {priorityConfig[task.priority].label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Statut */}
                {isEditing && (
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select
                      value={task.status}
                      onValueChange={(value: any) => setTask({ ...task, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        <SelectItem value="in-progress">En cours</SelectItem>
                        <SelectItem value="done">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date d'échéance */}
                {(task.due_date || isEditing) && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date d'échéance
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={task.due_date || ''}
                        onChange={(e) => setTask({ ...task, due_date: e.target.value })}
                      />
                    ) : (
                      <p className="text-base font-medium">
                        {new Date(task.due_date!).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la tâche ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La tâche sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
