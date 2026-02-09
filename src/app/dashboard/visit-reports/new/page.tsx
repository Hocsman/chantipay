'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  X,
  Loader2,
  Sparkles,
  FileText,
  AlertTriangle,
  Save,
  Send,
  Link as LinkIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  GenerateVisitReportResponse,
  VisitReportNonConformity,
} from '@/types/visit-report'

interface VisitPhoto {
  id: string
  name: string
  base64: string
}

const MAX_PHOTOS = 6
const MAX_PHOTO_SIZE = 4 * 1024 * 1024

const tradeOptions = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'autre', label: 'Autre' },
]

function severityBadgeVariant(severity: VisitReportNonConformity['severity']) {
  if (severity === 'high') return 'destructive'
  if (severity === 'medium') return 'secondary'
  return 'outline'
}

export default function NewVisitReportPage() {
  return (
    <Suspense fallback={
      <LayoutContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutContainer>
    }>
      <NewVisitReportContent />
    </Suspense>
  )
}

function NewVisitReportContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [photos, setPhotos] = useState<VisitPhoto[]>([])
  const [trade, setTrade] = useState('')
  const [context, setContext] = useState('')
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [quoteId, setQuoteId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [quotes, setQuotes] = useState<Array<{ id: string; quote_number: string; client_name?: string }>>([])
  const [invoices, setInvoices] = useState<Array<{ id: string; invoice_number: string; client_name: string }>>([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [report, setReport] = useState<GenerateVisitReportResponse | null>(null)
  const hasPrefilled = useRef(false)

  // Charger les devis et factures pour les sélecteurs
  useEffect(() => {
    async function loadRelations() {
      try {
        const [quotesRes, invoicesRes] = await Promise.all([
          fetch('/api/quotes'),
          fetch('/api/invoices'),
        ])

        if (quotesRes.ok) {
          const data = await quotesRes.json()
          setQuotes(data.quotes?.map((q: any) => ({
            id: q.id,
            quote_number: q.quote_number,
            client_name: q.clients?.name,
          })) || [])
        }

        if (invoicesRes.ok) {
          const data = await invoicesRes.json()
          setInvoices(data.invoices?.map((i: any) => ({
            id: i.id,
            invoice_number: i.invoice_number,
            client_name: i.client_name,
          })) || [])
        }
      } catch (error) {
        console.error('Erreur chargement relations:', error)
      } finally {
        setIsLoadingRelations(false)
      }
    }
    loadRelations()
  }, [])

  // Pré-remplir la date si fournie en paramètre
  useEffect(() => {
    const date = searchParams.get('date')
    if (date && !hasPrefilled.current) {
      hasPrefilled.current = true
      setVisitDate(date)
    }
  }, [searchParams])

  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
      reader.readAsDataURL(file)
    })
  }

  const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''

    if (files.length === 0) return

    const remainingSlots = MAX_PHOTOS - photos.length
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos autorisées`)
      return
    }

    const selectedFiles = files.slice(0, remainingSlots)
    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image valide`)
        return false
      }
      if (file.size > MAX_PHOTO_SIZE) {
        toast.error(`${file.name} dépasse 4MB`)
        return false
      }
      return true
    })

    try {
      const base64List = await Promise.all(validFiles.map((file) => fileToBase64(file)))
      const newPhotos = base64List.map((base64, index) => ({
        id: `${Date.now()}-${index}`,
        name: validFiles[index]?.name || `Photo ${photos.length + index + 1}`,
        base64,
      }))
      setPhotos((prev) => [...prev, ...newPhotos])
      setReport(null)
    } catch (error) {
      console.error('Erreur upload photo:', error)
      toast.error('Erreur lors du chargement des photos')
    }
  }, [photos.length])

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
    setReport(null)
  }

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      toast.error('Ajoutez au moins une photo')
      return
    }

    setIsAnalyzing(true)
    setReport(null)

    try {
      const response = await fetch('/api/ai/generate-visit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map((photo) => photo.base64),
          trade: trade || undefined,
          context: context || undefined,
          clientName: clientName || undefined,
          location: location || undefined,
          visitDate: visitDate || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      setReport(data)
      toast.success('Rapport généré')
    } catch (error) {
      console.error('Erreur analyse visite:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!report) return

    setIsDownloading(true)
    try {
      const response = await fetch('/api/visit-reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: {
            summary: report.summary,
            diagnostics: report.diagnostics,
            nonConformities: report.nonConformities,
            photoAnnotations: report.photoAnnotations,
            recommendations: report.recommendations,
          },
          photos: photos.map((photo) => photo.base64),
          metadata: {
            clientName: clientName || undefined,
            location: location || undefined,
            visitDate: visitDate || undefined,
            trade: trade || undefined,
            context: context || undefined,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la génération du PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-visite-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération du PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSave = async () => {
    if (!report) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/visit-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName || null,
          location: location || null,
          visitDate: visitDate || null,
          trade: trade || null,
          context: context || null,
          summary: report.summary,
          diagnostics: report.diagnostics,
          nonConformities: report.nonConformities,
          recommendations: report.recommendations,
          photoAnnotations: report.photoAnnotations,
          photos: photos.map((photo) => photo.base64),
          quoteId: quoteId || null,
          invoiceId: invoiceId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      const data = await response.json()
      toast.success('Rapport sauvegardé')
      router.push(`/dashboard/visit-reports/${data.report.id}`)
    } catch (error) {
      console.error('Erreur sauvegarde rapport:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <LayoutContainer>
      <div className="space-y-6 pb-24">
        <PageHeader
          title="Rapport de visite technique"
          description="Analysez des photos de chantier et générez un rapport PDF professionnel."
        />

        <Card>
          <CardHeader>
            <CardTitle>Informations de visite</CardTitle>
            <CardDescription>
              Contexte et données client pour le rapport.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="clientName">Client</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div>
              <Label htmlFor="visitDate">Date de visite</Label>
              <Input
                id="visitDate"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Adresse ou site"
              />
            </div>
            <div>
              <Label htmlFor="trade">Métier</Label>
              <Select value={trade} onValueChange={setTrade}>
                <SelectTrigger id="trade">
                  <SelectValue placeholder="Sélectionner un métier" />
                </SelectTrigger>
                <SelectContent>
                  {tradeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="context">Contexte</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex: visite suite à fuite, état général, contraintes d'accès..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Rattachement à un devis ou une facture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Rattachement (optionnel)
            </CardTitle>
            <CardDescription>
              Associez ce rapport à un devis ou une facture existant.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="quoteId">Devis associé</Label>
              <Select value={quoteId} onValueChange={setQuoteId} disabled={isLoadingRelations}>
                <SelectTrigger id="quoteId">
                  <SelectValue placeholder={isLoadingRelations ? "Chargement..." : "Aucun devis"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {quotes.map((quote) => (
                    <SelectItem key={quote.id} value={quote.id}>
                      {quote.quote_number} {quote.client_name ? `- ${quote.client_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoiceId">Facture associée</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId} disabled={isLoadingRelations}>
                <SelectTrigger id="invoiceId">
                  <SelectValue placeholder={isLoadingRelations ? "Chargement..." : "Aucune facture"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos du chantier</CardTitle>
            <CardDescription>Ajoutez jusqu'à {MAX_PHOTOS} photos (max 4MB chacune).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer des photos
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
                </label>
              </Button>
              <span className="text-sm text-muted-foreground">
                {photos.length}/{MAX_PHOTOS} photos ajoutées
              </span>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-lg border p-2">
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white border rounded-full p-1"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <img
                      src={photo.base64}
                      alt={photo.name}
                      className="h-32 w-full object-cover rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2 truncate">{photo.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Analyse IA
            </CardTitle>
            <CardDescription>
              Génère automatiquement le diagnostic, les non-conformités et les annotations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || photos.length === 0}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer le rapport
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {report && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <span>Rapport généré</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading || isSaving}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isDownloading}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Résumé</Label>
                <p className="text-sm text-muted-foreground mt-1">{report.summary}</p>
              </div>

              {context.trim() && (
                <div>
                  <Label>Notes utilisateur</Label>
                  <p className="text-sm text-muted-foreground mt-1">{context}</p>
                </div>
              )}

              {report.diagnostics.length > 0 && (
                <div>
                  <Label>Diagnostics</Label>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {report.diagnostics.map((item, index) => (
                      <li key={`diag-${index}`} className="flex gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.nonConformities.length > 0 && (
                <div>
                  <Label>Non-conformités détectées</Label>
                  <div className="mt-2 space-y-3">
                    {report.nonConformities.map((item, index) => (
                      <div key={`nc-${index}`} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="font-medium">{item.title}</span>
                          <Badge variant={severityBadgeVariant(item.severity)}>
                            {item.severity}
                          </Badge>
                        </div>
                        {item.reference && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Référence: {item.reference}
                          </p>
                        )}
                        {item.recommendation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Recommandation: {item.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.recommendations && report.recommendations.length > 0 && (
                <div>
                  <Label>Recommandations</Label>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {report.recommendations.map((item, index) => (
                      <li key={`rec-${index}`} className="flex gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label>Annotations des photos</Label>
                <div className="grid gap-4 md:grid-cols-2 mt-3">
                  {photos.map((photo, index) => {
                    const annotation = report.photoAnnotations.find((entry) => entry.index === index)
                    return (
                      <div key={photo.id} className="rounded-lg border p-3">
                        <img src={photo.base64} alt={photo.name} className="h-32 w-full object-cover rounded-md" />
                        <p className="text-sm font-medium mt-2">
                          {annotation?.title || `Photo ${index + 1}`}
                        </p>
                        <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                          {annotation?.annotations?.length ? (
                            annotation.annotations.map((item, noteIndex) => (
                              <li key={`note-${index}-${noteIndex}`} className="flex gap-2">
                                <span>•</span>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li>Aucune annotation disponible.</li>
                          )}
                        </ul>
                        {annotation?.notes && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Notes: {annotation.notes}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutContainer>
  )
}
