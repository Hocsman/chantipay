'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
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

interface SuggestionsAlertProps {
  items: QuoteItem[]
  trade?: string
  onAddItems: (items: Omit<QuoteItem, 'id'>[]) => void
  show: boolean
  onDismiss: () => void
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

export function SuggestionsAlert({
  items,
  trade,
  onAddItems,
  show,
  onDismiss,
}: SuggestionsAlertProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<ComplementSuggestion[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)

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
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setHasFetched(true)

      // Pre-select obligatory items
      const obligatoryIds = (data.suggestions || [])
        .filter((s: ComplementSuggestion) => s.category === 'obligatoire')
        .map((s: ComplementSuggestion) => s.id)
      setSelectedIds(new Set(obligatoryIds))
    } catch (error) {
      console.error('Erreur suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [items, trade, hasFetched])

  useEffect(() => {
    if (show && !hasFetched) {
      fetchSuggestions()
    }
  }, [show, hasFetched, fetchSuggestions])

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

    // Remove added suggestions from list
    setSuggestions(prev => prev.filter(s => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
  }

  if (!show || (suggestions.length === 0 && !isLoading)) {
    return null
  }

  const obligatoireCount = suggestions.filter(s => s.category === 'obligatoire').length
  const selectedTotal = suggestions
    .filter(s => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.estimated_price_ht, 0)

  return (
    <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left">
                  <AlertTitle className="text-amber-800 dark:text-amber-200">
                    Suggestions de compléments
                  </AlertTitle>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600" />
                  )}
                </button>
              </CollapsibleTrigger>
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
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
                  </>
                )}
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:text-amber-800"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CollapsibleContent className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map(suggestion => {
                const config = CATEGORY_CONFIG[suggestion.category]
                const Icon = config.icon

                return (
                  <div
                    key={suggestion.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.has(suggestion.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleSelection(suggestion.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(suggestion.id)}
                      onCheckedChange={() => toggleSelection(suggestion.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{suggestion.description}</span>
                        <Badge variant={config.badgeVariant} className="text-xs">
                          <Icon className="h-3 w-3 mr-1" />
                          {suggestion.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.reason}
                      </p>
                    </div>
                    <span className="font-medium text-sm whitespace-nowrap">
                      {formatCurrency(suggestion.estimated_price_ht)}
                    </span>
                  </div>
                )
              })}

              {suggestions.length > 0 && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Sélectionné :</span>
                    <span className="font-medium ml-2">
                      {selectedIds.size} élément(s) • {formatCurrency(selectedTotal)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddSelected}
                    disabled={selectedIds.size === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Alert>
  )
}
