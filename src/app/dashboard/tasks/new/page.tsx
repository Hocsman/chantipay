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
import { Loader2, ArrowLeft, Calendar, Clock, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Technician {
  id: string
  first_name: string
  last_name: string
  status: string
}

export default function NewTaskPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: '',
    scheduled_time: '',
    assigned_to: '',
  })

  // Charger les techniciens
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await fetch('/api/technicians')
        if (response.ok) {
          const data = await response.json()
          setTechnicians(data.technicians?.filter((t: Technician) => t.status === 'active') || [])
        }
      } catch (error) {
        console.error('Erreur chargement techniciens:', error)
      }
    }
    fetchTechnicians()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          scheduled_time: formData.scheduled_time || undefined,
          assigned_to: formData.assigned_to || undefined,
          status: 'todo',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      toast.success('Tâche créée avec succès')
      router.push('/dashboard/tasks')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LayoutContainer>
      <PageHeader title="Nouvelle tâche" description="Créer une nouvelle tâche" />

      <div className="max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Relancer client pour devis"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la tâche..."
                  rows={4}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Priorité */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date d'échéance */}
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date d&apos;échéance
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                {/* Horaire */}
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horaire
                  </Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>

                {/* Attribuée à */}
                <div className="space-y-2">
                  <Label htmlFor="assigned_to" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Attribuée à
                  </Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger id="assigned_to">
                      <SelectValue placeholder="Sélectionner un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.first_name} {tech.last_name}
                        </SelectItem>
                      ))}
                      {technicians.length === 0 && (
                        <SelectItem value="_none" disabled>
                          Aucun technicien
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer la tâche'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </LayoutContainer>
  )
}
