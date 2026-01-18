'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Camera,
  Loader2,
  Upload,
  ImageIcon,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface DetectedElement {
  name: string
  quantity?: number
  condition?: string
  notes?: string
}

interface PhotoAnalysisResult {
  description: string
  detectedElements: DetectedElement[]
  suggestedItems: Omit<QuoteItem, 'id'>[]
  estimatedSurface?: string
  additionalNotes?: string
}

interface PhotoAnalysisDialogProps {
  onAddItems: (items: Omit<QuoteItem, 'id'>[]) => void
  currentTrade?: string
  disabled?: boolean
}

export function PhotoAnalysisDialog({ onAddItems, currentTrade, disabled }: PhotoAnalysisDialogProps) {
  const [open, setOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [context, setContext] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 4MB)')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setResult(null)
      setSelectedItems(new Set())
    }
    reader.readAsDataURL(file)
  }, [])

  const handleAnalyze = async () => {
    if (!imagePreview) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          trade: currentTrade,
          context: context || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      const analysisResult: PhotoAnalysisResult = await response.json()
      setResult(analysisResult)

      // Pre-select all suggested items
      if (analysisResult.suggestedItems.length > 0) {
        setSelectedItems(new Set(analysisResult.suggestedItems.map((_, i) => i)))
      }

      toast.success('Analyse terminée', {
        description: `${analysisResult.suggestedItems.length} ligne(s) suggérée(s)`
      })
    } catch (error) {
      console.error('Erreur analyse photo:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'analyse')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedItems(newSelection)
  }

  const handleAddSelected = () => {
    if (!result || selectedItems.size === 0) return

    const itemsToAdd = result.suggestedItems.filter((_, i) => selectedItems.has(i))
    onAddItems(itemsToAdd)

    toast.success(`${itemsToAdd.length} ligne(s) ajoutée(s) au devis`)

    // Reset state
    setImagePreview(null)
    setResult(null)
    setSelectedItems(new Set())
    setContext('')
    setOpen(false)
  }

  const handleClose = () => {
    setImagePreview(null)
    setResult(null)
    setSelectedItems(new Set())
    setContext('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Camera className="h-4 w-4 mr-2" />
          Analyser une photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyse de photo avec IA
          </DialogTitle>
          <DialogDescription>
            Prenez ou importez une photo du chantier pour générer automatiquement des lignes de devis
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Upload zone */}
          {!imagePreview && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium mb-1">Cliquez pour importer une photo</p>
              <p className="text-sm text-muted-foreground">
                ou glissez-déposez une image (max 4MB)
              </p>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && !result && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Photo à analyser"
                  className="w-full max-h-[300px] object-contain rounded-lg bg-muted"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null)
                    setResult(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Context input */}
              <div className="space-y-2">
                <Label htmlFor="context">Contexte additionnel (optionnel)</Label>
                <Input
                  id="context"
                  placeholder="Ex: Rénovation salle de bain, remplacement chauffe-eau..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              {/* Analyze button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyser la photo
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Image thumbnail */}
              <div className="flex gap-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Photo analysée"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{result.description}</p>
                  {result.estimatedSurface && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Surface estimée: {result.estimatedSurface}
                    </p>
                  )}
                </div>
              </div>

              {/* Detected elements */}
              {result.detectedElements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Éléments détectés</p>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedElements.map((element, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {element.name}
                        {element.quantity && element.quantity > 1 && ` (×${element.quantity})`}
                        {element.condition && ` - ${element.condition}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested items */}
              {result.suggestedItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Lignes suggérées</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedItems.size === result.suggestedItems.length) {
                          setSelectedItems(new Set())
                        } else {
                          setSelectedItems(new Set(result.suggestedItems.map((_, i) => i)))
                        }
                      }}
                    >
                      {selectedItems.size === result.suggestedItems.length
                        ? 'Tout désélectionner'
                        : 'Tout sélectionner'}
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-4">
                      {result.suggestedItems.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedItems.has(index)
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleItemSelection(index)}
                        >
                          <Checkbox
                            checked={selectedItems.has(index)}
                            onCheckedChange={() => toggleItemSelection(index)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span>{item.quantity} × {formatCurrency(item.unit_price_ht)}</span>
                              <span>•</span>
                              <span>TVA {item.vat_rate}%</span>
                            </div>
                          </div>
                          <span className="font-medium text-sm">
                            {formatCurrency(item.quantity * item.unit_price_ht)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm text-orange-800 dark:text-orange-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Aucune ligne de devis suggérée pour cette photo.</span>
                  </div>
                </div>
              )}

              {/* Additional notes */}
              {result.additionalNotes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Notes</p>
                  <p>{result.additionalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setSelectedItems(new Set())
                }}
              >
                Nouvelle photo
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedItems.size === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter {selectedItems.size > 0 && `(${selectedItems.size})`}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
