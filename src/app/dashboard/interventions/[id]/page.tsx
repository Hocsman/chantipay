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
import { Loader2, ArrowLeft, Calendar, Clock, MapPin, Trash2, Save, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Intervention {
  id: string
  client_id: string | null
  client_name: string
  type: string
  description?: string
  address: string
  date: string
  time: string
  duration?: number
  status: 'planned' | 'in-progress' | 'completed' | 'canceled'
  notes?: string
}

const interventionTypes = [
  'Installation électrique',
  'Installation plomberie',
  'Dépannage électrique',
  'Dépannage plomberie',
  'Maintenance',
  'Rénovation',
  'Diagnostic',
  'Autre',
]

const statusOptions = [
  { value: 'planned', label: 'Planifiée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'in-progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'completed', label: 'Terminée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'canceled', label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
]

export default function InterventionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [intervention, setIntervention] = useState<Intervention | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadIntervention(p.id)
    })
  }, [])

  const loadIntervention = async (interventionId: string) => {
    try {
      const response = await fetch(`/api/interventions/${interventionId}`)
      if (response.ok) {
        const data = await response.json()
        setIntervention(data.intervention)
      } else {
        toast.error('Intervention non trouvée')
        router.push('/dashboard/interventions')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!intervention) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/interventions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervention),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      toast.success('✅ Intervention mise à jour')
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
      const response = await fetch(`/api/interventions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('✅ Intervention supprimée')
      router.push('/dashboard/interventions')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Intervention" description="Chargement..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!intervention) {
    return null
  }

  const handleCreateReport = () => {
    router.push(`/dashboard/visit-reports/new?interventionId=${intervention.id}`)
  }

  return (
    <LayoutContainer>
      <PageHeader 
        title="Intervention" 
        description={intervention.client_name}
      />

      <div className="max-w-4xl space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

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
              <Button variant="outline" onClick={handleCreateReport}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Rapport de visite
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
            <div className="grid gap-6 md:grid-cols-2">
              {/* Type d'intervention */}
              <div className="space-y-2 md:col-span-2">
                <Label>Type d'intervention</Label>
                {isEditing ? (
                  <Select
                    value={intervention.type}
                    onValueChange={(value) => setIntervention({ ...intervention, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interventionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-lg font-medium">{intervention.type}</p>
                )}
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label>Client</Label>
                <p className="text-base">{intervention.client_name}</p>
              </div>

              {/* Statut */}
              <div className="space-y-2">
                <Label>Statut</Label>
                {isEditing ? (
                  <Select
                    value={intervention.status}
                    onValueChange={(value: any) => setIntervention({ ...intervention, status: value })}
                  >
                    <SelectTrigger>
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
                  <span className={cn('inline-block text-sm font-medium px-3 py-1.5 rounded-full', 
                    statusOptions.find(s => s.value === intervention.status)?.color
                  )}>
                    {statusOptions.find(s => s.value === intervention.status)?.label}
                  </span>
                )}
              </div>

              {/* Adresse */}
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                {isEditing ? (
                  <Textarea
                    value={intervention.address}
                    onChange={(e) => setIntervention({ ...intervention, address: e.target.value })}
                    rows={2}
                  />
                ) : (
                  <p className="text-base">{intervention.address}</p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={intervention.date}
                    onChange={(e) => setIntervention({ ...intervention, date: e.target.value })}
                  />
                ) : (
                  <p className="text-base font-medium">
                    {new Date(intervention.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Heure */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure
                </Label>
                {isEditing ? (
                  <Input
                    type="time"
                    value={intervention.time}
                    onChange={(e) => setIntervention({ ...intervention, time: e.target.value })}
                  />
                ) : (
                  <p className="text-base font-medium">{intervention.time}</p>
                )}
              </div>

              {/* Durée */}
              {(intervention.duration || isEditing) && (
                <div className="space-y-2">
                  <Label>Durée estimée (minutes)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={intervention.duration || ''}
                      onChange={(e) => setIntervention({ ...intervention, duration: parseInt(e.target.value) || undefined })}
                      placeholder="60"
                      min="15"
                      step="15"
                    />
                  ) : (
                    <p className="text-base">{intervention.duration} minutes</p>
                  )}
                </div>
              )}

              {/* Description */}
              {(intervention.description || isEditing) && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={intervention.description || ''}
                      onChange={(e) => setIntervention({ ...intervention, description: e.target.value })}
                      rows={3}
                      placeholder="Détails de l'intervention..."
                    />
                  ) : (
                    <p className="text-base">{intervention.description}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              {(intervention.notes || isEditing) && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes internes</Label>
                  {isEditing ? (
                    <Textarea
                      value={intervention.notes || ''}
                      onChange={(e) => setIntervention({ ...intervention, notes: e.target.value })}
                      rows={3}
                      placeholder="Notes, rappels..."
                    />
                  ) : (
                    <p className="text-base text-muted-foreground">{intervention.notes}</p>
                  )}
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
            <DialogTitle>Supprimer l'intervention ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'intervention sera définitivement supprimée.
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
