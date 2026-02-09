'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Camera,
  Clock,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Technician {
  id: string
  first_name: string
  last_name: string
}

interface TimeEntry {
  id: string
  entry_type: string
  timestamp: string
  latitude?: number
  longitude?: number
  location_address?: string
  photo_url?: string
  notes?: string
}

const entryTypeConfig = {
  clock_in: {
    label: 'Début',
    fullLabel: 'Début de journée',
    icon: Play,
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  clock_out: {
    label: 'Fin',
    fullLabel: 'Fin de journée',
    icon: Square,
    color: 'bg-red-500',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  break_start: {
    label: 'Pause',
    fullLabel: 'Début de pause',
    icon: Coffee,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  break_end: {
    label: 'Reprise',
    fullLabel: 'Fin de pause',
    icon: CheckCircle2,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

function calculateDayStats(entries: TimeEntry[]) {
  // Trier les entrées par timestamp
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  let totalWorkMinutes = 0
  let totalBreakMinutes = 0
  let clockInTime: Date | null = null
  let breakStartTime: Date | null = null

  for (const entry of sorted) {
    const time = new Date(entry.timestamp)

    switch (entry.entry_type) {
      case 'clock_in':
        clockInTime = time
        break
      case 'clock_out':
        if (clockInTime) {
          totalWorkMinutes += (time.getTime() - clockInTime.getTime()) / 60000
          clockInTime = null
        }
        break
      case 'break_start':
        breakStartTime = time
        break
      case 'break_end':
        if (breakStartTime) {
          totalBreakMinutes +=
            (time.getTime() - breakStartTime.getTime()) / 60000
          breakStartTime = null
        }
        break
    }
  }

  const netWorkMinutes = Math.max(0, totalWorkMinutes - totalBreakMinutes)

  return {
    totalWorkMinutes: Math.round(totalWorkMinutes),
    totalBreakMinutes: Math.round(totalBreakMinutes),
    netWorkMinutes: Math.round(netWorkMinutes),
  }
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins.toString().padStart(2, '0')}`
}

export default function TechnicianHistoriquePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [technician, setTechnician] = useState<Technician | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    loadTechnician()
  }, [id])

  useEffect(() => {
    if (technician) {
      loadEntries()
    }
  }, [technician, selectedDate])

  const loadTechnician = async () => {
    try {
      const response = await fetch(`/api/technicians/${id}`)
      if (!response.ok) throw new Error('Technicien non trouvé')
      const data = await response.json()
      setTechnician(data.technician)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Technicien non trouvé')
      router.push('/mobile/technicians')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEntries = async () => {
    try {
      const response = await fetch(
        `/api/time-entries?technician_id=${id}&date=${selectedDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    const today = new Date().toISOString().split('T')[0]
    if (date.toISOString().split('T')[0] <= today) {
      setSelectedDate(date.toISOString().split('T')[0])
    }
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  if (isLoading) {
    return (
      <MobileLayout title="Historique" showBottomNav={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  if (!technician) return null

  const stats = calculateDayStats(entries)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <MobileLayout title="Historique" showBottomNav={false}>
      <div className="p-4">
        <Link
          href={`/mobile/technicians/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* Info technicien */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">
                  {technician.first_name} {technician.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Historique des pointages
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection de date */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-auto border-0 text-center font-medium"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                disabled={isToday}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-2">
              {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>

        {/* Résumé du jour */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Résumé du jour</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {formatMinutes(stats.netWorkMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">Travail net</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {formatMinutes(stats.totalWorkMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">Temps total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">
                  {formatMinutes(stats.totalBreakMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">Pauses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des pointages */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Pointages</h3>
              <Badge variant="secondary" className="ml-auto">
                {entries.length}
              </Badge>
            </div>

            {sortedEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aucun pointage ce jour
              </p>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry) => {
                  const config =
                    entryTypeConfig[
                      entry.entry_type as keyof typeof entryTypeConfig
                    ]
                  const Icon = config?.icon || Clock
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                          config?.color || 'bg-gray-500'
                        )}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={cn('text-xs', config?.badgeColor)}>
                            {config?.fullLabel || entry.entry_type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {new Date(entry.timestamp).toLocaleTimeString(
                              'fr-FR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        </div>

                        {/* Infos supplémentaires */}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          {entry.latitude && entry.longitude && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              GPS
                            </span>
                          )}
                          {entry.photo_url && (
                            <span className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Photo
                            </span>
                          )}
                        </div>

                        {entry.location_address && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {entry.location_address}
                          </p>
                        )}

                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{entry.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lien vers pointage */}
        <div className="mt-4">
          <Link href={`/mobile/technicians/${id}/pointage`}>
            <Button className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Nouveau pointage
            </Button>
          </Link>
        </div>

        <div className="h-8" />
      </div>
    </MobileLayout>
  )
}
