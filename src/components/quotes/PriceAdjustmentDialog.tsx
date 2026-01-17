'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  getPriceSuggestion,
  analyzePriceWithSuggestion,
  formatPriceRange,
  getConfidenceBadge,
  type PriceSuggestion,
} from '@/lib/ai/priceSuggestions'

interface PriceAdjustmentDialogProps {
  description: string
  quantity: number
  currentPrice: number
  onApplyPrice: (newPrice: number) => void
}

/**
 * Composant Desktop : Dialog pour ajuster le prix d'une ligne avec suggestions IA
 */
export function PriceAdjustmentDialog({
  description,
  quantity,
  currentPrice,
  onApplyPrice,
}: PriceAdjustmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [tempPrice, setTempPrice] = useState(currentPrice)
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)

  useEffect(() => {
    if (open) {
      setTempPrice(currentPrice)
      const priceSuggestion = getPriceSuggestion(description, quantity)
      setSuggestion(priceSuggestion)
    }
  }, [open, description, quantity, currentPrice])

  const analysis = analyzePriceWithSuggestion(description, tempPrice, quantity)
  const confidenceBadge = suggestion ? getConfidenceBadge(suggestion.confidence) : null

  const handleApply = () => {
    onApplyPrice(tempPrice)
    setOpen(false)
  }

  const applyAveragePrice = () => {
    if (suggestion) {
      setTempPrice(Number(suggestion.avgPrice.toFixed(2)))
    }
  }

  const applyMinPrice = () => {
    if (suggestion) {
      setTempPrice(Number(suggestion.minPrice.toFixed(2)))
    }
  }

  const applyMaxPrice = () => {
    if (suggestion) {
      setTempPrice(Number(suggestion.maxPrice.toFixed(2)))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ajuster le prix
          </DialogTitle>
          <DialogDescription>
            Suggestions de prix basées sur le marché
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description de la ligne */}
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm font-medium line-clamp-2">{description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Quantité : {quantity}
            </p>
          </div>

          {/* Prix actuel */}
          <div>
            <Label htmlFor="price">Prix unitaire HT</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={tempPrice}
                onChange={(e) => setTempPrice(Number(e.target.value))}
                className="flex-1"
              />
              <span className="flex items-center text-sm text-muted-foreground">€</span>
            </div>
          </div>

          {/* Suggestions de prix */}
          {suggestion && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Prix moyen du marché
                </Label>
                {confidenceBadge && (
                  <Badge variant="outline" className={confidenceBadge.color}>
                    {confidenceBadge.label}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPriceRange(suggestion)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyMinPrice}
                  className="text-xs"
                >
                  Min {suggestion.minPrice.toFixed(0)} €
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyAveragePrice}
                  className="text-xs"
                >
                  Moyen {suggestion.avgPrice.toFixed(0)} €
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyMaxPrice}
                  className="text-xs"
                >
                  Max {suggestion.maxPrice.toFixed(0)} €
                </Button>
              </div>
            </div>
          )}

          {/* Analyse du prix */}
          <div
            className={`rounded-lg border p-3 ${
              analysis.isPriceAberrant
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {analysis.isPriceAberrant ? (
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{analysis.message}</p>
            </div>
          </div>

          {/* Total */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total HT</span>
              <span className="text-lg font-bold">
                {(tempPrice * quantity).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
