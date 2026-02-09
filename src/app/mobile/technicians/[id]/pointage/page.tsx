'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AlertCircle,
  X,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Technician {
  id: string
  first_name: string
  last_name: string
  status: string
}

interface TimeEntry {
  id: string
  entry_type: string
  timestamp: string
  latitude?: number
  longitude?: number
  photo_url?: string
  notes?: string
}

interface Task {
  id: string
  title: string
}

const entryTypeConfig = {
  clock_in: {
    label: 'Début de journée',
    icon: Play,
    color: 'bg-green-500',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
  clock_out: {
    label: 'Fin de journée',
    icon: Square,
    color: 'bg-red-500',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  break_start: {
    label: 'Début de pause',
    icon: Coffee,
    color: 'bg-orange-500',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
  },
  break_end: {
    label: 'Fin de pause',
    icon: CheckCircle2,
    color: 'bg-blue-500',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
}

export default function TechnicianPointagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [technician, setTechnician] = useState<Technician | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  // État du formulaire
  const [selectedType, setSelectedType] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')

  // État GPS
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number
    address?: string
  } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // État caméra
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    loadData()
    return () => {
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [id])

  const loadData = async () => {
    try {
      // Charger le technicien
      const techResponse = await fetch(`/api/technicians/${id}`)
      if (!techResponse.ok) throw new Error('Technicien non trouvé')
      const techData = await techResponse.json()
      setTechnician(techData.technician)

      // Charger les pointages du jour
      const today = new Date().toISOString().split('T')[0]
      const entriesResponse = await fetch(
        `/api/time-entries?technician_id=${id}&date=${today}`
      )
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json()
        setTodayEntries(entriesData.entries || [])
      }

      // Charger les tâches actives
      const tasksResponse = await fetch('/api/tasks?status=in_progress')
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.tasks || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
      router.push('/mobile/technicians')
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        }
      )

      const loc: {
        latitude: number
        longitude: number
        accuracy: number
        address?: string
      } = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      // Essayer de récupérer l'adresse via reverse geocoding
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          loc.address = geoData.display_name
        }
      } catch {
        // Pas grave si le geocoding échoue
      }

      setLocation(loc)
      toast.success('Position GPS capturée')
    } catch (error) {
      const geoError = error as GeolocationPositionError
      let message = 'Impossible de récupérer la position'
      if (geoError.code === 1) message = 'Accès à la géolocalisation refusé'
      if (geoError.code === 2) message = 'Position non disponible'
      if (geoError.code === 3) message = 'Délai dépassé'
      setLocationError(message)
      toast.error(message)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const openCamera = async () => {
    setCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      setStream(mediaStream)
      setIsCameraOpen(true)

      // Attendre que la vidéo soit montée
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      }, 100)
    } catch (error) {
      console.error('Erreur caméra:', error)
      setCameraError('Impossible d\'accéder à la caméra')
      toast.error('Accès à la caméra refusé')
    }
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhotoBase64(dataUrl)

    // Fermer la caméra
    closeCamera()
    toast.success('Photo capturée')
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
  }

  const removePhoto = () => {
    setPhotoBase64(null)
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error('Sélectionnez un type de pointage')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: id,
          entryType: selectedType,
          latitude: location?.latitude,
          longitude: location?.longitude,
          locationAccuracy: location?.accuracy,
          locationAddress: location?.address,
          photoBase64: photoBase64,
          taskId: selectedTaskId || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors du pointage')
      }

      toast.success('Pointage enregistré !')

      // Réinitialiser le formulaire
      setSelectedType('')
      setNotes('')
      setSelectedTaskId('')
      setLocation(null)
      setPhotoBase64(null)

      // Recharger les pointages
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors du pointage'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Déterminer le prochain type de pointage suggéré
  const getNextSuggestedType = () => {
    if (todayEntries.length === 0) return 'clock_in'

    const lastEntry = todayEntries[0]
    switch (lastEntry.entry_type) {
      case 'clock_in':
        return 'break_start'
      case 'break_start':
        return 'break_end'
      case 'break_end':
        return 'clock_out'
      case 'clock_out':
        return 'clock_in'
      default:
        return 'clock_in'
    }
  }

  useEffect(() => {
    if (!selectedType && todayEntries.length >= 0 && !isLoading) {
      setSelectedType(getNextSuggestedType())
    }
  }, [todayEntries, isLoading])

  if (isLoading) {
    return (
      <MobileLayout title="Pointage" showBottomNav={false}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  if (!technician) return null

  const currentTypeConfig = selectedType
    ? entryTypeConfig[selectedType as keyof typeof entryTypeConfig]
    : undefined

  return (
    <MobileLayout title="Pointage" showBottomNav={false}>
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
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">
                  {technician.first_name} {technician.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {todayEntries.length} pointage
                  {todayEntries.length > 1 ? 's' : ''} aujourd'hui
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal Caméra */}
        {isCameraOpen && (
          <div className="fixed inset-0 z-50 bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-16 w-16 bg-white/20 border-white"
                onClick={closeCamera}
              >
                <X className="h-8 w-8 text-white" />
              </Button>
              <Button
                size="lg"
                className="rounded-full h-20 w-20 bg-white"
                onClick={takePhoto}
              >
                <Camera className="h-10 w-10 text-black" />
              </Button>
            </div>
          </div>
        )}

        {/* Type de pointage */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Type de pointage</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(entryTypeConfig).map(([type, config]) => {
                const Icon = config.icon
                const isSelected = selectedType === type
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    )}
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        config.color
                      )}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-center">
                      {config.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Localisation GPS */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Localisation GPS</h3>
              </div>
              {location && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Capturée
                </Badge>
              )}
            </div>

            {location ? (
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Précision : {location.accuracy.toFixed(0)}m
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setLocation(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            ) : (
              <>
                {locationError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {locationError}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Localisation...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Capturer ma position
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Photo */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Photo</h3>
              </div>
              {photoBase64 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Capturée
                </Badge>
              )}
            </div>

            {photoBase64 ? (
              <div className="relative">
                <img
                  src={photoBase64}
                  alt="Photo pointage"
                  className="w-full rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {cameraError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {cameraError}
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={openCamera}>
                  <Camera className="h-4 w-4 mr-2" />
                  Prendre une photo
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tâche associée (optionnel) */}
        {tasks.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Tâche associée (optionnel)</h3>
              <Select
                value={selectedTaskId}
                onValueChange={setSelectedTaskId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tâche" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Notes (optionnel)</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Bouton de soumission */}
        <Button
          className={cn('w-full h-14 text-lg', currentTypeConfig?.buttonColor)}
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedType}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : currentTypeConfig ? (
            <>
              <currentTypeConfig.icon className="h-5 w-5 mr-2" />
              {currentTypeConfig.label}
            </>
          ) : (
            'Sélectionnez un type'
          )}
        </Button>

        {/* Historique du jour */}
        {todayEntries.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Pointages du jour</h3>
              <div className="space-y-3">
                {todayEntries.map((entry) => {
                  const config =
                    entryTypeConfig[entry.entry_type as keyof typeof entryTypeConfig]
                  const Icon = config?.icon || Clock
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          config?.color || 'bg-gray-500'
                        )}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{config?.label || entry.entry_type}</p>
                        {entry.latitude && entry.longitude && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            GPS capturé
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
              <Link
                href={`/mobile/technicians/${id}/historique`}
                className="block text-center text-sm text-primary mt-4"
              >
                Voir l'historique complet →
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="h-8" />
      </div>
    </MobileLayout>
  )
}
