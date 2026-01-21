'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Lightbulb,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface ComplementSuggestion {
  id: string
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category: 'obligatoire' | 'recommandé' | 'optionnel'
  estimated_price_ht: number
  vat_rate: number
}

interface SuggestionsSheetProps {
  items: QuoteItem[]
  trade?: string
  region?: string
  season?: string
  onAddItems: (items: Omit<QuoteItem, 'id'>[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORY_CONFIG = {
  obligatoire: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    badgeVariant: 'destructive' as const,
  },
  recommandé: {
    icon: CheckCircle2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    badgeVariant: 'default' as const,
  },
  optionnel: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    badgeVariant: 'secondary' as const,
  },
}

export function SuggestionsSheet({
  items,
  trade,
  region,
  season,
  onAddItems,
  open,
  onOpenChange,
}: SuggestionsSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ComplementSuggestion[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [hasFetched, setHasFetched] = useState(false)
  const [isPersonalized, setIsPersonalized] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const fetchSuggestions = useCallback(async () => {
    if (items.length === 0 || hasFetched) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/suggest-complements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unit_price_ht: i.unit_price_ht,
            vat_rate: i.vat_rate,
          })),
          trade,
          region,
          season,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setHasFetched(true)
      setIsPersonalized(Boolean(data.personalized))

      // Pre-select obligatory items
      const obligatoryIds = (data.suggestions || [])
        .filter((s: ComplementSuggestion) => s.category === 'obligatoire')
        .map((s: ComplementSuggestion) => s.id)
      setSelectedIds(new Set(obligatoryIds))
    } catch (error) {
      console.error('Erreur suggestions:', error)
      toast.error('Impossible de charger les suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [items, trade, region, season, hasFetched])

  useEffect(() => {
    if (open && !hasFetched) {
      fetchSuggestions()
    }
  }, [open, hasFetched, fetchSuggestions])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddSelected = () => {
    const selectedSuggestions = suggestions.filter(s => selectedIds.has(s.id))
    const itemsToAdd: Omit<QuoteItem, 'id'>[] = selectedSuggestions.map(s => ({
      description: s.description,
      quantity: 1,
      unit_price_ht: s.estimated_price_ht,
      vat_rate: s.vat_rate,
    }))

    onAddItems(itemsToAdd)
    toast.success(`${itemsToAdd.length} complément(s) ajouté(s)`)

    if (selectedSuggestions.length > 0) {
      fetch('/api/ai/suggest-complements/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestions: selectedSuggestions.map((suggestion) => ({
            id: suggestion.id,
            description: suggestion.description,
            category: suggestion.category,
            estimated_price_ht: suggestion.estimated_price_ht,
            vat_rate: suggestion.vat_rate,
          })),
          trade,
          region,
          season,
        }),
      }).catch((error) => {
        console.warn('Erreur enregistrement acceptation suggestion:', error)
      })
    }

    // Close sheet and reset
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const obligatoireCount = suggestions.filter(s => s.category === 'obligatoire').length
  const selectedTotal = suggestions
    .filter(s => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.estimated_price_ht, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Compléments suggérés
          </SheetTitle>
          <SheetDescription>
            {isLoading ? (
              'Analyse en cours...'
            ) : (
              <>
                {suggestions.length} élément(s) suggéré(s)
                {obligatoireCount > 0 && (
                  <span className="text-red-600 font-medium ml-1">
                    dont {obligatoireCount} obligatoire(s)
                  </span>
                )}
                {isPersonalized && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    • Personnalisé selon vos habitudes
                  </span>
                )}
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-amber-600 mb-4" />
              <p className="text-muted-foreground">Analyse de votre devis...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="font-medium">Votre devis semble complet !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aucun complément suggéré pour le moment.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(85vh-280px)]">
              <div className="space-y-3 pr-4">
                {suggestions.map(suggestion => {
                  const config = CATEGORY_CONFIG[suggestion.category]
                  const Icon = config.icon
                  const isSelected = selectedIds.has(suggestion.id)

                  return (
                    <div
                      key={suggestion.id}
                      className={`rounded-lg border-2 p-4 active:scale-[0.98] transition-transform ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-muted'
                      }`}
                      onClick={() => toggleSelection(suggestion.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(suggestion.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{suggestion.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={config.badgeVariant} className="text-xs">
                                  <Icon className="h-3 w-3 mr-1" />
                                  {suggestion.category}
                                </Badge>
                              </div>
                            </div>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {formatCurrency(suggestion.estimated_price_ht)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <SheetFooter className="flex gap-2 pt-4 mt-4 border-t">
          {suggestions.length > 0 ? (
            <>
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size} sélectionné(s)
                </p>
                <p className="font-semibold text-sm">
                  {formatCurrency(selectedTotal)} HT
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Ignorer
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedIds.size === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter ({selectedIds.size})
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
