'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  ExternalLink,
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
    label: 'Début de journée',
    icon: Play,
    color: 'bg-green-500',
    badgeColor: 'bg-green-100 text-green-700',
  },
  clock_out: {
    label: 'Fin de journée',
    icon: Square,
    color: 'bg-red-500',
    badgeColor: 'bg-red-100 text-red-700',
  },
  break_start: {
    label: 'Début de pause',
    icon: Coffee,
    color: 'bg-orange-500',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  break_end: {
    label: 'Fin de pause',
    icon: CheckCircle2,
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
}

function calculateDayStats(entries: TimeEntry[]) {
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

export default function TechnicianHistoriqueDesktopPage({
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
      router.push('/dashboard/technicians')
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

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!technician) return null

  const stats = calculateDayStats(entries)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <LayoutContainer>
      <PageHeader
        title="Historique des pointages"
        description={`${technician.first_name} ${technician.last_name}`}
      />

      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/technicians/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la fiche
        </Link>
        <Link
          href={`/dashboard/technicians/${id}/pointage`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Play className="h-4 w-4" />
          Nouveau pointage
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Colonne latérale - Navigation date */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                Date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-auto text-center"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextDay}
                  disabled={isToday}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>

              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={goToToday}
                >
                  Aujourd'hui
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-5 w-5" />
                Résumé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {formatMinutes(stats.netWorkMinutes)}
                </p>
                <p className="text-sm text-muted-foreground">Travail net</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xl font-semibold">
                    {formatMinutes(stats.totalWorkMinutes)}
                  </p>
                  <p className="text-xs text-muted-foreground">Temps total</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-orange-500">
                    {formatMinutes(stats.totalBreakMinutes)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pauses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Technicien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {technician.first_name} {technician.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entries.length} pointage{entries.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne principale - Liste des pointages */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pointages du{' '}
                {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                })}
                <Badge variant="secondary" className="ml-2">
                  {entries.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun pointage ce jour
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Heure</TableHead>
                      <TableHead>Localisation</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEntries.map((entry) => {
                      const config =
                        entryTypeConfig[
                          entry.entry_type as keyof typeof entryTypeConfig
                        ]
                      const Icon = config?.icon || Clock
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'h-8 w-8 rounded-full flex items-center justify-center',
                                  config?.color || 'bg-gray-500'
                                )}
                              >
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <Badge className={cn(config?.badgeColor)}>
                                {config?.label || entry.entry_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Date(entry.timestamp).toLocaleTimeString(
                              'fr-FR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.latitude && entry.longitude ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <a
                                  href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  Voir sur carte
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                            {entry.location_address && (
                              <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                {entry.location_address}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.photo_url ? (
                              <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">
                                  Oui
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.notes ? (
                              <p className="text-sm max-w-xs truncate">
                                {entry.notes}
                              </p>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutContainer>
  )
}
