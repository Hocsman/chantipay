'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ArrowLeft, Calendar, Clock, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

const priorityOptions = [
  { value: 'low', label: 'Basse', color: 'text-green-600' },
  { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
  { value: 'high', label: 'Haute', color: 'text-red-600' },
]

interface Technician {
  id: string
  first_name: string
  last_name: string
  status: string
}

export default function NewTaskMobilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [technicians, setTechnicians] = useState<Technician[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

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

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      toast.success('Tâche créée avec succès')
      router.push('/mobile/tasks')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MobileLayout title="Nouvelle tâche" subtitle="Ajouter une action" showBottomNav={false}>
      <div className="p-4 pb-24 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails de la tâche</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Rappeler M. Dupont pour le devis"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="h-12"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Détails de la tâche..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              {/* Priorité */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date d'échéance */}
              <div className="space-y-2">
                <Label htmlFor="due_date">Date d&apos;échéance (optionnelle)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={handleChange}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {/* Horaire */}
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Horaire (optionnel)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduled_time"
                    name="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={handleChange}
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {/* Attribuée à */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Attribuée à
                </Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="h-12">
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

              {/* Info */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Astuce</p>
                <p className="text-xs">
                  Vous pourrez lier cette tâche à un devis, client ou intervention après sa création.
                </p>
              </div>

              {/* Bouton de soumission */}
              <Button type="submit" disabled={isLoading} className="w-full h-12" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Créer la tâche'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
