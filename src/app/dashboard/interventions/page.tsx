'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'

interface Intervention {
  id: string
  client_name: string
  type: string
  address: string
  date: string
  time: string
  status: 'planned' | 'in-progress' | 'completed' | 'canceled'
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  canceled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const statusLabels = {
  planned: 'Planifiée',
  'in-progress': 'En cours',
  completed: 'Terminée',
  canceled: 'Annulée',
}

export default function InterventionsPage() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInterventions()
  }, [])

  const loadInterventions = async () => {
    try {
      const response = await fetch('/api/interventions')
      if (response.ok) {
        const data = await response.json()
        setInterventions(data.interventions || [])
      }
    } catch (error) {
      console.error('Erreur chargement interventions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Interventions"
        description="Planifiez et gérez vos chantiers"
        action={
          <Button className="hidden sm:flex" onClick={() => router.push('/dashboard/interventions/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && interventions.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="Aucune intervention"
          description="Commencez par planifier votre première intervention"
          action={{
            label: 'Nouvelle intervention',
            onClick: () => router.push('/dashboard/interventions/new'),
          }}
        />
      )}

      {!isLoading && interventions.length > 0 && (
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <Card 
              key={intervention.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/interventions/${intervention.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{intervention.client_name}</h3>
                    <p className="text-sm text-muted-foreground">{intervention.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[intervention.status]}`}>
                      {statusLabels[intervention.status]}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{intervention.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => router.push('/dashboard/interventions/new')}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center z-40"
          aria-label="Nouvelle intervention"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </LayoutContainer>
  )
}
