'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Loader2,
  User,
  Phone,
  Mail,
  Clock,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

interface Technician {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status: 'active' | 'inactive' | 'on_leave'
  specialties: string[]
  created_at: string
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  inactive: { label: 'Inactif', variant: 'secondary' },
  on_leave: { label: 'En congé', variant: 'outline' },
}

const specialtyLabels: Record<string, string> = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  chauffage: 'Chauffage',
  climatisation: 'Climatisation',
  menuiserie: 'Menuiserie',
  peinture: 'Peinture',
  maconnerie: 'Maçonnerie',
  autre: 'Autre',
}

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTechnicians()
  }, [])

  const loadTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians')
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data.technicians || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Techniciens" description="Gérez votre équipe" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Techniciens"
        description={`${technicians.length} technicien${technicians.length > 1 ? 's' : ''}`}
        action={
          <Link href="/dashboard/technicians/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau technicien
            </Button>
          </Link>
        }
      />

      {technicians.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun technicien</h3>
            <p className="text-muted-foreground mb-4">
              Ajoutez votre premier technicien pour gérer les pointages
            </p>
            <Link href="/dashboard/technicians/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un technicien
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians.map((tech) => {
            const status = statusLabels[tech.status] || statusLabels.active
            return (
              <Link key={tech.id} href={`/dashboard/technicians/${tech.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {tech.first_name} {tech.last_name}
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {tech.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{tech.phone}</span>
                        </div>
                      )}
                      {tech.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{tech.email}</span>
                        </div>
                      )}
                    </div>

                    {tech.specialties && tech.specialties.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {tech.specialties.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {specialtyLabels[spec] || spec}
                          </Badge>
                        ))}
                        {tech.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tech.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </LayoutContainer>
  )
}
