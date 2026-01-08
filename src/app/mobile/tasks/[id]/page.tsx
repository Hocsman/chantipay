'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
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
import { Loader2, ArrowLeft, Calendar, Trash2, Save, CheckCircle2, Circle } from 'lucide-react'
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
  created_at: string
}

const priorityOptions = [
  { value: 'low', label: 'Basse', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'high', label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

const statusOptions = [
  { value: 'todo', label: 'À faire', icon: Circle },
  { value: 'in-progress', label: 'En cours', icon: Loader2 },
  { value: 'done', label: 'Terminée', icon: CheckCircle2 },
]

export default function TaskDetailMobilePage({ params }: { params: Promise<{ id: string }> }) {
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
        router.push('/mobile/tasks')
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

      toast.success('✅ Tâche mise à jour')
      setIsEditing(false)
      loadTask(id) // Recharger pour obtenir completed_at à jour
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
      router.push('/mobile/tasks')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!task) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    
    setTask({ ...task, status: newStatus })
    
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      toast.success(newStatus === 'done' ? '✅ Tâche terminée' : '📝 Tâche réouverte')
      loadTask(id)
    } catch (error) {
      console.error('Erreur:', error)
      setTask({ ...task, status: task.status }) // Revenir à l'état précédent
    }
  }

  if (isLoading) {
    return (
      <MobileLayout title="Tâche" subtitle="Chargement..." showBottomNav={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  if (!task) {
    return null
  }

  const StatusIcon = statusOptions.find(s => s.value === task.status)?.icon || Circle

  return (
    <MobileLayout title="Tâche" subtitle={task.title} showBottomNav={false}>
      <div className="p-4 pb-24 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Actions rapides */}
        <div className="flex gap-2">
          <Button
            onClick={handleToggleStatus}
            variant={task.status === 'done' ? 'outline' : 'default'}
            className="flex-1"
          >
            {task.status === 'done' ? (
              <>
                <Circle className="mr-2 h-4 w-4" />
                Réouvrir
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marquer terminée
              </>
            )}
          </Button>
        </div>

        {/* Actions d'édition */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
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
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                Modifier
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Informations */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label>Titre</Label>
              {isEditing ? (
                <Input
                  value={task.title}
                  onChange={(e) => setTask({ ...task, title: e.target.value })}
                  className="h-12"
                />
              ) : (
                <h2 className={cn(
                  'text-lg font-medium',
                  task.status === 'done' && 'line-through text-muted-foreground'
                )}>
                  {task.title}
                </h2>
              )}
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label>Statut</Label>
              {isEditing ? (
                <Select
                  value={task.status}
                  onValueChange={(value: any) => setTask({ ...task, status: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn(
                    'h-5 w-5',
                    task.status === 'done' && 'text-green-500',
                    task.status === 'in-progress' && 'text-yellow-500 animate-spin',
                    task.status === 'todo' && 'text-muted-foreground'
                  )} />
                  <span className="font-medium">
                    {statusOptions.find(s => s.value === task.status)?.label}
                  </span>
                </div>
              )}
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <Label>Priorité</Label>
              {isEditing ? (
                <Select
                  value={task.priority}
                  onValueChange={(value: any) => setTask({ ...task, priority: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className={cn(
                  'inline-block text-xs font-medium px-3 py-1.5 rounded-full',
                  priorityOptions.find(p => p.value === task.priority)?.color
                )}>
                  {priorityOptions.find(p => p.value === task.priority)?.label}
                </span>
              )}
            </div>

            {/* Date d'échéance */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date d'échéance
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={task.due_date || ''}
                  onChange={(e) => setTask({ ...task, due_date: e.target.value || undefined })}
                  className="h-12"
                />
              ) : task.due_date ? (
                <p className="text-base font-medium">
                  {new Date(task.due_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune échéance</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              {isEditing ? (
                <Textarea
                  value={task.description || ''}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  rows={4}
                  placeholder="Détails de la tâche..."
                />
              ) : task.description ? (
                <p className="text-base whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune description</p>
              )}
            </div>

            {/* Date de création */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Créée le</span>
                <span>
                  {new Date(task.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {task.completed_at && (
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>Terminée le</span>
                  <span>
                    {new Date(task.completed_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
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
    </MobileLayout>
  )
}
