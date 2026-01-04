'use client'

import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, ChevronRight, Plus } from 'lucide-react'
import { EmptyState } from '@/components/mobile/EmptyState'

// Données de démo pour interventions
const demoInterventions = [
  {
    id: '1',
    client: 'Jean Dupont',
    type: 'Installation électrique',
    address: '15 Rue de la République, Paris',
    date: '2026-01-08',
    time: '09:00',
    status: 'planned' as const,
  },
  {
    id: '2',
    client: 'Marie Martin',
    type: 'Dépannage plomberie',
    address: '28 Avenue des Champs, Lyon',
    date: '2026-01-10',
    time: '14:00',
    status: 'planned' as const,
  },
]

export default function InterventionsPage() {
  const interventions = demoInterventions

  return (
    <LayoutContainer>
      <PageHeader
        title="Interventions"
        description="Planifiez et gérez vos chantiers"
        action={
          <Button className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Button>
        }
      />

      {interventions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucune intervention"
          description="Commencez par planifier votre première intervention"
          action={{
            label: 'Nouvelle intervention',
            onClick: () => {
              // TODO: Ouvrir le formulaire de création
              console.log('Create intervention')
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          {interventions.map((intervention) => (
            <Card key={intervention.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{intervention.client}</h3>
                    <p className="text-sm text-muted-foreground">{intervention.type}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
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

                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Modifier
                  </Button>
                  <Button size="sm" className="flex-1">
                    Démarrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB Mobile */}
      <div className="md:hidden">
        <button
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center z-40"
          aria-label="Nouvelle intervention"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </LayoutContainer>
  )
}
