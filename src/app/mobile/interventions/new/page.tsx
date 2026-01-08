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
import { Loader2, ArrowLeft, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
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

export default function NewInterventionMobilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    type: '',
    description: '',
    address: '',
    date: '',
    time: '09:00',
    duration: '60',
    notes: '',
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      client_name: client?.name || '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      toast.success('✅ Intervention créée avec succès')
      router.push('/mobile/interventions')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MobileLayout title="Nouvelle intervention" subtitle="Planifier un chantier" showBottomNav={false}>
      <div className="p-4 pb-24 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails de l'intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                {loadingClients ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Select
                    value={formData.client_id}
                    onValueChange={handleClientChange}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {clients.length === 0 && !loadingClients && (
                  <p className="text-sm text-muted-foreground">
                    Aucun client. <button type="button" onClick={() => router.push('/mobile/clients/new')} className="text-primary underline">Créer un client</button>
                  </p>
                )}
              </div>

              {/* Type d'intervention */}
              <div className="space-y-2">
                <Label htmlFor="type">Type d'intervention *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {interventionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Détails de l'intervention..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="15 Rue de la République, 75001 Paris"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={2}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {/* Heure */}
              <div className="space-y-2">
                <Label htmlFor="time">Heure *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="h-12 pl-10"
                  />
                </div>
              </div>

              {/* Durée estimée */}
              <div className="space-y-2">
                <Label htmlFor="duration">Durée estimée (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="60"
                  value={formData.duration}
                  onChange={handleChange}
                  min="15"
                  step="15"
                  className="h-12"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Notes, rappels, matériel nécessaire..."
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              {/* Bouton de soumission */}
              <Button type="submit" disabled={isLoading} className="w-full h-12" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Créer l\'intervention'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
