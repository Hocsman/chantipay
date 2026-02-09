'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, User, Phone, Mail } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'
import { cn } from '@/lib/utils'

interface Technician {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status: string
  specialties: string[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  on_leave: { label: 'En congé', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
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

export default function MobileTechniciansPage() {
  const router = useRouter()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

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
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTechnicians = technicians.filter((tech) => {
    const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase()
    return fullName.includes(search.toLowerCase())
  })

  if (isLoading) {
    return (
      <MobileLayout title="Techniciens" subtitle="Gérez votre équipe">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Techniciens" subtitle={`${technicians.length} membre${technicians.length > 1 ? 's' : ''}`}>
      <div className="p-4 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un technicien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des techniciens */}
        {filteredTechnicians.length === 0 ? (
          <EmptyState
            icon={User}
            title={search ? 'Aucun résultat' : 'Aucun technicien'}
            description={search ? 'Modifiez votre recherche' : 'Ajoutez votre premier technicien'}
            action={
              !search
                ? {
                    label: 'Ajouter un technicien',
                    onClick: () => router.push('/mobile/technicians/new'),
                  }
                : undefined
            }
            variant="colorful"
          />
        ) : (
          <div className="space-y-3">
            {filteredTechnicians.map((tech) => {
              const status = statusConfig[tech.status] || statusConfig.active
              return (
                <Card
                  key={tech.id}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => router.push(`/mobile/technicians/${tech.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {tech.first_name} {tech.last_name}
                          </h3>
                          <Badge className={cn('text-xs flex-shrink-0', status.color)}>
                            {status.label}
                          </Badge>
                        </div>

                        {/* Contact */}
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {tech.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" />
                              <span className="truncate">{tech.phone}</span>
                            </div>
                          )}
                          {tech.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{tech.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Spécialités */}
                        {tech.specialties && tech.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tech.specialties.slice(0, 3).map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">
                                {specialtyLabels[s] || s}
                              </Badge>
                            ))}
                            {tech.specialties.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tech.specialties.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <FloatingActionButton
        href="/mobile/technicians/new"
        label="Nouveau technicien"
      />
    </MobileLayout>
  )
}
