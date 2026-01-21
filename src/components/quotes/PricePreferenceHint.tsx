'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  History,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  Loader2,
  Info,
} from 'lucide-react'
import { FeedbackButtonsInline } from '@/components/ai/FeedbackButtons'

interface PriceHint {
  message: string | null
  suggestedPrice: number | null
  confidence: 'high' | 'medium' | 'low'
  basedOn: number
}

interface PricePreferenceHintProps {
  description: string
  currentPrice: number
  onApplyPrice?: (price: number) => void
  compact?: boolean
}

const CONFIDENCE_CONFIG = {
  high: {
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200',
    icon: Check,
    label: 'Confiance élevée',
  },
  medium: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200',
    icon: Info,
    label: 'Confiance moyenne',
  },
  low: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200',
    icon: Info,
    label: 'Peu de données',
  },
}

export function PricePreferenceHint({
  description,
  currentPrice,
  onApplyPrice,
  compact = false,
}: PricePreferenceHintProps) {
  const [hint, setHint] = useState<PriceHint | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastDescriptionRef = useRef<string>('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const fetchHint = useCallback(async (desc: string) => {
    if (!desc || desc.length < 10) {
      setHint(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemDescription: desc }),
      })

      if (response.ok) {
        const data: PriceHint = await response.json()
        setHint(data)
      } else {
        setHint(null)
      }
    } catch (error) {
      console.error('Erreur récupération hint:', error)
      setHint(null)
    } finally {
      setIsLoading(false)
      setHasChecked(true)
    }
  }, [])

  // Déclencher la recherche avec debounce
  useEffect(() => {
    // Ne pas relancer si la description n'a pas changé
    if (description === lastDescriptionRef.current) {
      return
    }
    lastDescriptionRef.current = description

    // Reset
    setHasChecked(false)

    // Debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (description && description.length >= 10) {
      debounceRef.current = setTimeout(() => {
        fetchHint(description)
      }, 800) // Attendre 800ms après la dernière frappe
    } else {
      setHint(null)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [description, fetchHint])

  // Ne rien afficher si pas de hint ou pas de suggestion
  if (!hint || !hint.suggestedPrice || hint.basedOn === 0) {
    if (isLoading && description.length >= 10) {
      return compact ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : null
    }
    return null
  }

  const config = CONFIDENCE_CONFIG[hint.confidence]
  const Icon = config.icon
  const priceDiff = currentPrice - hint.suggestedPrice
  const priceDiffPercent = hint.suggestedPrice > 0
    ? Math.round((priceDiff / hint.suggestedPrice) * 100)
    : 0

  // Déterminer si le prix actuel est proche de la suggestion
  const isCloseToSuggestion = Math.abs(priceDiffPercent) <= 10

  // Mode compact (pour l'utilisation inline)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity`}
                onClick={() => onApplyPrice?.(hint.suggestedPrice!)}
              >
                <History className="h-3 w-3" />
                {formatCurrency(hint.suggestedPrice)}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{hint.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Basé sur {hint.basedOn} devis précédent(s)
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <FeedbackButtonsInline
          context="price_hint"
          itemId={`price-hint-${description.slice(0, 20)}`}
          metadata={{ description, suggestedPrice: hint.suggestedPrice }}
        />
      </div>
    )
  }

  // Mode complet
  return (
    <div className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start gap-2">
        <History className={`h-4 w-4 mt-0.5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Historique de prix</span>
            <Badge variant="secondary" className="text-xs">
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          {hint.message && (
            <p className="text-sm text-muted-foreground mt-1">
              {hint.message}
            </p>
          )}

          {/* Comparaison avec le prix actuel */}
          {currentPrice > 0 && !isCloseToSuggestion && (
            <div className="flex items-center gap-2 mt-2">
              {priceDiff > 0 ? (
                <div className="flex items-center text-amber-600 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+{priceDiffPercent}% par rapport à l'habitude</span>
                </div>
              ) : (
                <div className="flex items-center text-blue-600 text-xs">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  <span>{priceDiffPercent}% par rapport à l'habitude</span>
                </div>
              )}
            </div>
          )}

          {/* Bouton appliquer */}
          {onApplyPrice && currentPrice !== hint.suggestedPrice && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() => onApplyPrice(hint.suggestedPrice!)}
            >
              <Check className="h-3 w-3 mr-1" />
              Appliquer {formatCurrency(hint.suggestedPrice)}
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            Basé sur {hint.basedOn} devis précédent(s)
          </p>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Composant d'alerte d'anomalie de prix
// ===========================================
interface PriceAnomalyAlertProps {
  price: number
  threshold: { low: number; high: number } | null
}

export function PriceAnomalyAlert({ price, threshold }: PriceAnomalyAlertProps) {
  if (!threshold || price === 0) return null

  const { low, high } = threshold

  if (price >= low && price <= high) return null

  const isLow = price < low
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${isLow ? 'text-blue-600' : 'text-amber-600'}`}>
      <AlertTriangle className="h-3 w-3" />
      <span>
        {isLow
          ? `Prix bas par rapport à vos habitudes (habituellement > ${formatCurrency(low)})`
          : `Prix élevé par rapport à vos habitudes (habituellement < ${formatCurrency(high)})`}
      </span>
    </div>
  )
}
