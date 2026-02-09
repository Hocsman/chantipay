'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Loader2, Save, Trash2, Mail, Phone, User, Clock, History, Timer } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const specialties = [
  { id: 'plomberie', label: 'Plomberie' },
  { id: 'electricite', label: 'Électricité' },
  { id: 'chauffage', label: 'Chauffage' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'menuiserie', label: 'Menuiserie' },
  { id: 'peinture', label: 'Peinture' },
  { id: 'maconnerie', label: 'Maçonnerie' },
  { id: 'autre', label: 'Autre' },
]

const statusOptions = [
  { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactif', color: 'bg-gray-100 text-gray-700' },
  { value: 'on_leave', label: 'En congé', color: 'bg-orange-100 text-orange-700' },
]

interface Technician {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status: string
  specialties: string[]
  notes?: string
  created_at: string
}

export default function TechnicianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    notes: '',
  })
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  useEffect(() => {
    loadTechnician()
  }, [id])

  const loadTechnician = async () => {
    try {
      const response = await fetch(`/api/technicians/${id}`)
      if (!response.ok) {
        throw new Error('Technicien non trouvé')
      }
      const data = await response.json()
      setTechnician(data.technician)
      setFormData({
        firstName: data.technician.first_name || '',
        lastName: data.technician.last_name || '',
        email: data.technician.email || '',
        phone: data.technician.phone || '',
        status: data.technician.status || 'active',
        notes: data.technician.notes || '',
      })
      setSelectedSpecialties(data.technician.specialties || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Technicien non trouvé')
      router.push('/dashboard/technicians')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSpecialty = (specialtyId: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialtyId)
        ? prev.filter((s) => s !== specialtyId)
        : [...prev, specialtyId]
    )
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Prénom et nom requis')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/technicians/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          specialties: selectedSpecialties,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast.success('Technicien mis à jour')
      loadTechnician()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/technicians/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast.success('Technicien supprimé')
      router.push('/dashboard/technicians')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!technician) {
    return null
  }

  const currentStatus = statusOptions.find((s) => s.value === formData.status)

  return (
    <LayoutContainer>
      <PageHeader
        title={`${technician.first_name} ${technician.last_name}`}
        description="Fiche technicien"
      />

      <Link
        href="/dashboard/technicians"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      <div className="grid gap-6 max-w-4xl lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spécialités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {specialties.map((specialty) => (
                  <div key={specialty.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty.id}
                      checked={selectedSpecialties.includes(specialty.id)}
                      onCheckedChange={() => toggleSpecialty(specialty.id)}
                    />
                    <Label htmlFor={specialty.id} className="cursor-pointer">
                      {specialty.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Notes internes sur le technicien..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce technicien ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le technicien sera définitivement supprimé.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {technician.first_name} {technician.last_name}
                  </p>
                  <Badge className={currentStatus?.color}>
                    {currentStatus?.label}
                  </Badge>
                </div>
              </div>

              {formData.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${formData.email}`} className="hover:underline">
                    {formData.email}
                  </a>
                </div>
              )}

              {formData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${formData.phone}`} className="hover:underline">
                    {formData.phone}
                  </a>
                </div>
              )}

              {selectedSpecialties.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Spécialités</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpecialties.map((s) => {
                      const spec = specialties.find((sp) => sp.id === s)
                      return (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {spec?.label || s}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Créé le {new Date(technician.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions de pointage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Pointage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/technicians/${id}/pointage`}>
                <Button variant="default" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Nouveau pointage
                </Button>
              </Link>
              <Link href={`/dashboard/technicians/${id}/historique`}>
                <Button variant="outline" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  Historique
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutContainer>
  )
}
