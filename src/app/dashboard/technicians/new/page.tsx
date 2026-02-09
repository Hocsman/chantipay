'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
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

export default function NewTechnicianPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Prénom et nom requis')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          specialties: selectedSpecialties,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }

      const data = await response.json()
      toast.success('Technicien créé avec succès')
      router.push(`/dashboard/technicians/${data.technician.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Nouveau technicien"
        description="Ajoutez un membre à votre équipe"
      />

      <Link
        href="/dashboard/technicians"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la liste
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
                placeholder="Jean"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Dupont"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="jean.dupont@email.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="06 12 34 56 78"
              />
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Créer le technicien
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </LayoutContainer>
  )
}
