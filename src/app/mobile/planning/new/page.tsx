'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, Clock, User, Wrench } from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  address?: string
}

const INTERVENTION_TYPES = [
  'Installation',
  'Dépannage',
  'Maintenance',
  'Rénovation',
  'Diagnostic',
  'Autre'
]

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1h', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
  { label: 'Journée', value: 480 },
]

export default function NewInterventionMobilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  const [formData, setFormData] = useState({
    client_id: '',
    type: '',
    description: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration: 120,
    notes: ''
  })

  // Charger les clients
  useEffect(() => {
    const loadClients = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/mobile/auth')
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, address')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) {
        console.error('Erreur chargement clients:', error)
      } else if (data) {
        setClients(data)
      }
      setLoadingClients(false)
    }

    loadClients()
  }, [router])

  // Mettre à jour l'adresse quand un client est sélectionné
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setFormData({
      ...formData,
      client_id: clientId,
      address: client?.address || formData.address
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id || !formData.type || !formData.address || !formData.date || !formData.time) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/mobile/auth')
        return
      }

      // Récupérer le nom du client
      const selectedClient = clients.find(c => c.id === formData.client_id)
      if (!selectedClient) {
        toast.error('Client introuvable')
        return
      }

      const { error } = await supabase
        .from('interventions')
        .insert({
          user_id: session.user.id,
          client_id: formData.client_id,
          client_name: selectedClient.name,
          type: formData.type,
          description: formData.description || null,
          address: formData.address,
          date: formData.date,
          time: formData.time,
          duration: formData.duration,
          status: 'planned',
          notes: formData.notes || null
        })

      if (error) throw error

      toast.success('Intervention créée avec succès')
      router.push('/mobile/planning')
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création de l\'intervention')
    } finally {
      setLoading(false)
    }
  }

  if (loadingClients) {
    return (
      <MobileLayout 
        title="Nouvelle intervention"
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout 
      title="Nouvelle intervention"
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Client */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Client</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select 
                value={formData.client_id} 
                onValueChange={handleClientChange}
              >
                <SelectTrigger id="client">
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
            </div>

            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun client trouvé. Créez d'abord un client.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Détails intervention */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Détails de l'intervention</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'intervention *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVENTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez brièvement l'intervention..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lieu et horaires */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Lieu et horaires</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Textarea
                id="address"
                placeholder="Adresse complète du chantier"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Heure *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durée estimée</Label>
              <Select 
                value={formData.duration.toString()} 
                onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((dur) => (
                    <SelectItem key={dur.value} value={dur.value.toString()}>
                      {dur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                placeholder="Notes, matériel nécessaire, informations complémentaires..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || clients.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer l\'intervention'
            )}
          </Button>
        </div>
      </form>
    </MobileLayout>
  )
}
