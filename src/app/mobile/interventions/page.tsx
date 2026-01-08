'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'

interface Intervention {
  id: string
  client: string
  type: string
  address: string
  date: string
  time: string
  status: 'planned' | 'in-progress' | 'completed' | 'canceled'
}

export default function MobileInterventionsPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Charger les interventions depuis l'API
    // Pour l'instant, données de démo
    setTimeout(() => {
      setInterventions([
        {
          id: '1',
          client: 'Jean Dupont',
          type: 'Installation électrique',
          address: '15 Rue de la République, Paris',
          date: '2026-01-08',
          time: '09:00',
          status: 'planned',
        },
        {
          id: '2',
          client: 'Marie Martin',
          type: 'Dépannage plomberie',
          address: '28 Avenue des Champs, Lyon',
          date: '2026-01-10',
          time: '14:00',
          status: 'planned',
        },
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const getStatusColor = (status: Intervention['status']) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'canceled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: Intervention['status']) => {
    switch (status) {
      case 'planned':
        return 'Planifiée'
      case 'in-progress':
        return 'En cours'
      case 'completed':
        return 'Terminée'
      case 'canceled':
        return 'Annulée'
      default:
        return status
    }
  }

  return (
    <MobileLayout title="Interventions" subtitle="Vos chantiers planifiés">
      <div className="p-4 space-y-4">
        {/* Bouton Nouvelle intervention */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => router.push('/mobile/interventions/new')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle intervention
        </Button>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Liste des interventions */}
        {!isLoading && interventions.length > 0 && (
          <div className="space-y-3">
            {interventions.map((intervention) => (
              <Card 
                key={intervention.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => router.push(`/mobile/interventions/${intervention.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{intervention.client}</h3>
                      <p className="text-sm text-muted-foreground">{intervention.type}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>

                  {/* Adresse */}
                  <div className="flex items-start gap-2 text-sm mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{intervention.address}</span>
                  </div>

                  {/* Date et heure */}
                  <div className="flex items-center justify-between gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(intervention.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{intervention.time}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex justify-end">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(intervention.status)}`}>
                      {getStatusLabel(intervention.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && interventions.length === 0 && (
          <EmptyState
            icon={Calendar}
            title="Aucune intervention"
            description="Commencez par planifier votre première intervention pour organiser vos chantiers."
            variant="colorful"
          />
        )}
      </div>
    </MobileLayout>
  )
}
