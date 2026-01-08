'use client'

import { useState, useEffect } from 'react'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import { useRouter } from 'next/navigation'

interface Intervention {
  id: string
  title: string
  intervention_type: string
  scheduled_date: string
  scheduled_time?: string
  status: string
  client_name?: string
}

export default function CalendarPage() {
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
        setInterventions(data.interventions)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  // Convertir les interventions en événements FullCalendar
  const calendarEvents = interventions.map((intervention) => {
    const startDate = intervention.scheduled_date
    const startTime = intervention.scheduled_time || '09:00'
    const start = `${startDate}T${startTime}`

    // Couleur selon le statut
    let backgroundColor = '#3B82F6' // blue-500 par défaut
    let borderColor = '#2563EB' // blue-600

    switch (intervention.status) {
      case 'scheduled':
        backgroundColor = '#3B82F6' // blue
        borderColor = '#2563EB'
        break
      case 'in_progress':
        backgroundColor = '#F59E0B' // amber
        borderColor = '#D97706'
        break
      case 'completed':
        backgroundColor = '#10B981' // green
        borderColor = '#059669'
        break
      case 'canceled':
        backgroundColor = '#6B7280' // gray
        borderColor = '#4B5563'
        break
    }

    return {
      id: intervention.id,
      title: `${intervention.intervention_type} - ${intervention.client_name || 'Client'}`,
      start,
      backgroundColor,
      borderColor,
      extendedProps: {
        intervention,
      },
    }
  })

  const handleEventClick = (info: any) => {
    const interventionId = info.event.id
    router.push(`/dashboard/interventions/${interventionId}`)
  }

  const handleDateClick = (info: any) => {
    // Rediriger vers la création d'intervention avec la date pré-remplie
    router.push(`/dashboard/interventions/new?date=${info.dateStr}`)
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Calendrier Planning" description="Vue calendrier de vos interventions" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader 
        title="Calendrier Planning" 
        description={`${interventions.length} intervention${interventions.length > 1 ? 's' : ''} planifiée${interventions.length > 1 ? 's' : ''}`}
      />

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Planifiée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500"></div>
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Terminée</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-500"></div>
                <span>Annulée</span>
              </div>
            </div>
            <Button onClick={() => router.push('/dashboard/interventions/new')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Nouvelle intervention
            </Button>
          </div>

          <div className="fullcalendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={frLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{
                today: "Aujourd'hui",
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              height="auto"
              selectable={true}
              editable={false}
              dayMaxEvents={true}
              weekends={true}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              nowIndicator={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .fullcalendar-wrapper {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent));
        }

        .fullcalendar-wrapper .fc {
          font-family: inherit;
        }

        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          font-weight: 500;
        }

        .fullcalendar-wrapper .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
        }

        .fullcalendar-wrapper .fc-event:hover {
          opacity: 0.8;
        }

        .fullcalendar-wrapper .fc-daygrid-day-number {
          color: hsl(var(--foreground));
        }

        .fullcalendar-wrapper .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-weight: 600;
        }

        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
          font-weight: bold;
        }
      `}</style>
    </LayoutContainer>
  )
}
