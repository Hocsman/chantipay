'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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

interface PriceAdjustmentSheetProps {
  description: string
  quantity: number
  currentPrice: number
  onApplyPrice: (newPrice: number) => void
}

/**
 * Composant Mobile : Sheet pour ajuster le prix d'une ligne avec suggestions IA
 */
export function PriceAdjustmentSheet({
  description,
  quantity,
  currentPrice,
  onApplyPrice,
}: PriceAdjustmentSheetProps) {
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 className="h-3 w-3" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ajuster le prix
          </SheetTitle>
          <SheetDescription>
            Suggestions de prix basées sur le marché
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Description de la ligne */}
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm font-medium">{description}</p>
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
                className="flex-1 text-lg"
              />
              <span className="flex items-center text-lg text-muted-foreground">€</span>
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
                <span className="text-3xl font-bold text-primary">
                  {formatPriceRange(suggestion)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyMinPrice}
                  className="text-xs h-12"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Min</span>
                    <span className="font-bold">{suggestion.minPrice.toFixed(0)} €</span>
                  </div>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyAveragePrice}
                  className="text-xs h-12"
                >
                  <div className="flex flex-col">
                    <span className="text-xs">Moyen</span>
                    <span className="font-bold">{suggestion.avgPrice.toFixed(0)} €</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyMaxPrice}
                  className="text-xs h-12"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Max</span>
                    <span className="font-bold">{suggestion.maxPrice.toFixed(0)} €</span>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Analyse du prix */}
          <div
            className={`rounded-lg border p-4 ${
              analysis.isPriceAberrant
                ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {analysis.isPriceAberrant ? (
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{analysis.message}</p>
            </div>
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total HT</span>
              <span className="text-2xl font-bold">
                {(tempPrice * quantity).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Appliquer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
