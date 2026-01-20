'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, Loader2, Sparkles, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type {
  GenerateVisitReportResponse,
  VisitReportNonConformity,
} from '@/types/visit-report';

interface VisitPhoto {
  id: string;
  name: string;
  base64: string;
}

const MAX_PHOTOS = 6;
const MAX_PHOTO_SIZE = 4 * 1024 * 1024;

const tradeOptions = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'autre', label: 'Autre' },
];

function severityBadgeVariant(severity: VisitReportNonConformity['severity']) {
  if (severity === 'high') return 'destructive';
  if (severity === 'medium') return 'secondary';
  return 'outline';
}

export default function NewVisitReportMobilePage() {
  return (
    <Suspense
      fallback={
        <MobileLayout title="Rapport de visite">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </MobileLayout>
      }
    >
      <NewVisitReportMobileContent />
    </Suspense>
  );
}

function NewVisitReportMobileContent() {
  const searchParams = useSearchParams();
  const [photos, setPhotos] = useState<VisitPhoto[]>([]);
  const [trade, setTrade] = useState('');
  const [context, setContext] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [report, setReport] = useState<GenerateVisitReportResponse | null>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const hasPrefilled = useRef(false);

  useEffect(() => {
    const interventionId = searchParams.get('interventionId');
    if (!interventionId || hasPrefilled.current) return;

    hasPrefilled.current = true;
    setIsPrefilling(true);

    const normalizeText = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const mapTradeFromType = (type?: string) => {
      const normalized = normalizeText(type || '');
      if (normalized.includes('plomb')) return 'plomberie';
      if (normalized.includes('elect')) return 'electricite';
      if (normalized.includes('renov')) return 'renovation';
      if (normalized.includes('peint')) return 'peinture';
      if (normalized.includes('menuis')) return 'menuiserie';
      return '';
    };

    const loadIntervention = async () => {
      try {
        const response = await fetch(`/api/interventions/${interventionId}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Intervention non trouvée');
        }

        const data = await response.json();
        const intervention = data.intervention;

        if (!intervention) {
          throw new Error('Intervention non trouvée');
        }

        setClientName((prev) => prev || intervention.client_name || '');
        setLocation((prev) => prev || intervention.address || '');
        setVisitDate((prev) => prev || intervention.date || '');

        const mappedTrade = mapTradeFromType(intervention.type);
        setTrade((prev) => prev || mappedTrade);

        const contextParts: string[] = [];
        if (intervention.description) contextParts.push(`Description: ${intervention.description}`);
        if (intervention.notes) contextParts.push(`Notes: ${intervention.notes}`);
        if (intervention.time) contextParts.push(`Horaire prévu: ${intervention.time}`);
        if (intervention.duration) contextParts.push(`Durée estimée: ${intervention.duration} min`);
        const combinedContext = contextParts.join('\n');
        if (combinedContext) {
          setContext((prev) => prev || combinedContext);
        }
      } catch (error) {
        console.error('Erreur pré-remplissage intervention:', error);
        toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement de l\'intervention');
      } finally {
        setIsPrefilling(false);
      }
    };

    loadIntervention();
  }, [searchParams]);

  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos autorisées`);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image valide`);
        return false;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        toast.error(`${file.name} dépasse 4MB`);
        return false;
      }
      return true;
    });

    try {
      const base64List = await Promise.all(validFiles.map((file) => fileToBase64(file)));
      const newPhotos = base64List.map((base64, index) => ({
        id: `${Date.now()}-${index}`,
        name: validFiles[index]?.name || `Photo ${photos.length + index + 1}`,
        base64,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      setReport(null);
    } catch (error) {
      console.error('Erreur upload photo:', error);
      toast.error('Erreur lors du chargement des photos');
    }
  }, [photos.length]);

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    setReport(null);
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      toast.error('Ajoutez au moins une photo');
      return;
    }

    setIsAnalyzing(true);
    setReport(null);

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
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      setReport(data);
      toast.success('Rapport généré');
    } catch (error) {
      console.error('Erreur analyse visite:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    setIsDownloading(true);
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
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-visite-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération du PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <MobileLayout title="Rapport visite" subtitle="Photos + PDF">
      <div className="px-4 pb-24 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informations de visite</CardTitle>
            <CardDescription>
              Contexte et données client.
              {isPrefilling ? ' Pré-remplissage...' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div>
              <Label htmlFor="context">Contexte</Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex: visite suite à fuite, contraintes d'accès..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos du chantier</CardTitle>
            <CardDescription>Jusqu'à {MAX_PHOTOS} photos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <label className="cursor-pointer w-full justify-center">
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
            <p className="text-xs text-muted-foreground mt-2">
              {photos.length}/{MAX_PHOTOS} photos ajoutées
            </p>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
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
                      className="h-24 w-full object-cover rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1 truncate">{photo.name}</p>
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
            <CardDescription>Génère diagnostic, non-conformités et annotations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || photos.length === 0} className="w-full">
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
              <CardTitle>Rapport généré</CardTitle>
              <CardDescription>Consultez le diagnostic et téléchargez le PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="w-full"
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
                  <Label>Non-conformités</Label>
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
                <div className="grid gap-3 mt-3">
                  {photos.map((photo, index) => {
                    const annotation = report.photoAnnotations.find((entry) => entry.index === index);
                    return (
                      <div key={photo.id} className="rounded-lg border p-3">
                        <img src={photo.base64} alt={photo.name} className="h-24 w-full object-cover rounded-md" />
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
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
