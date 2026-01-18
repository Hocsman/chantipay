'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Camera,
  Loader2,
  Upload,
  X,
  Sparkles,
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

interface PhotoAnalysisSheetProps {
  onAddItems: (items: Omit<QuoteItem, 'id'>[]) => void
  currentTrade?: string
  disabled?: boolean
}

export function PhotoAnalysisSheet({ onAddItems, currentTrade, disabled }: PhotoAnalysisSheetProps) {
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

      toast.success('Analyse terminée')
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

    toast.success(`${itemsToAdd.length} ligne(s) ajoutée(s)`)

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled}>
          <Camera className="h-4 w-4 mr-2" />
          Analyser une photo
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analyse de photo
          </SheetTitle>
          <SheetDescription>
            Prenez une photo du chantier
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Upload zone */}
          {!imagePreview && (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center active:scale-[0.98] transition-transform"
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
              <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">Prendre une photo</p>
              <p className="text-xs text-muted-foreground">
                ou importer depuis la galerie
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
                  className="w-full max-h-[200px] object-contain rounded-lg bg-muted"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
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
                <Label htmlFor="context-mobile" className="text-sm">Contexte (optionnel)</Label>
                <Input
                  id="context-mobile"
                  placeholder="Ex: Rénovation salle de bain..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Analyze button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full h-12"
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
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-4 pr-4">
                {/* Image thumbnail + description */}
                <div className="flex gap-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Photo analysée"
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{result.description}</p>
                    {result.estimatedSurface && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Surface: {result.estimatedSurface}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detected elements */}
                {result.detectedElements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.detectedElements.map((element, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {element.name}
                        {element.quantity && element.quantity > 1 && ` ×${element.quantity}`}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggested items */}
                {result.suggestedItems.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {selectedItems.size}/{result.suggestedItems.length} sélectionné(s)
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          if (selectedItems.size === result.suggestedItems.length) {
                            setSelectedItems(new Set())
                          } else {
                            setSelectedItems(new Set(result.suggestedItems.map((_, i) => i)))
                          }
                        }}
                      >
                        {selectedItems.size === result.suggestedItems.length
                          ? 'Désélectionner'
                          : 'Tout sélectionner'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {result.suggestedItems.map((item, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 rounded-lg border active:scale-[0.98] transition-transform ${
                            selectedItems.has(index)
                              ? 'border-primary bg-primary/5'
                              : ''
                          }`}
                          onClick={() => toggleItemSelection(index)}
                        >
                          <Checkbox
                            checked={selectedItems.has(index)}
                            onCheckedChange={() => toggleItemSelection(index)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{item.description}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">
                                {item.quantity} × {formatCurrency(item.unit_price_ht)}
                              </span>
                              <span className="font-medium text-sm">
                                {formatCurrency(item.quantity * item.unit_price_ht)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm text-orange-800 dark:text-orange-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Aucune ligne suggérée pour cette photo.</span>
                    </div>
                  </div>
                )}

                {/* Additional notes */}
                {result.additionalNotes && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-800 dark:text-blue-200">
                    <p>{result.additionalNotes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <SheetFooter className="flex gap-2 pt-4 mt-4 border-t">
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setSelectedItems(new Set())
                  setImagePreview(null)
                }}
                className="flex-1"
              >
                Nouvelle photo
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedItems.size === 0}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ({selectedItems.size})
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Fermer
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
