'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Layers,
  Loader2,
  Sparkles,
  Check,
  TrendingDown,
  Minus,
  TrendingUp,
  Star,
} from 'lucide-react'
import { toast } from 'sonner'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface QuoteVariant {
  tier: 'eco' | 'standard' | 'premium'
  name: string
  description: string
  items: QuoteItem[]
  totalHT: number
  highlights: string[]
}

interface GenerateVariantsResult {
  variants: QuoteVariant[]
  explanation?: string
}

interface ComparativeQuotesDialogProps {
  items: QuoteItem[]
  onSelectVariant: (items: QuoteItem[]) => void
  currentTrade?: string
  disabled?: boolean
}

const TIER_CONFIG = {
  eco: {
    icon: TrendingDown,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeVariant: 'secondary' as const,
  },
  standard: {
    icon: Minus,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    badgeVariant: 'default' as const,
  },
  premium: {
    icon: TrendingUp,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeVariant: 'secondary' as const,
  },
}

export function ComparativeQuotesDialog({
  items,
  onSelectVariant,
  currentTrade,
  disabled,
}: ComparativeQuotesDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateVariantsResult | null>(null)
  const [selectedTier, setSelectedTier] = useState<'eco' | 'standard' | 'premium'>('standard')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleGenerate = async () => {
    if (items.length === 0) {
      toast.error('Ajoutez au moins une ligne au devis')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseItems: items,
          trade: currentTrade,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      const variantsResult: GenerateVariantsResult = await response.json()
      setResult(variantsResult)
      setSelectedTier('standard')

      toast.success('3 versions générées', {
        description: 'Choisissez la version qui convient le mieux',
      })
    } catch (error) {
      console.error('Erreur génération variantes:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return

    const selectedVariant = result.variants.find((v) => v.tier === selectedTier)
    if (!selectedVariant) return

    onSelectVariant(selectedVariant.items)
    toast.success(`Version ${selectedVariant.name} appliquée`)

    // Reset state
    setResult(null)
    setSelectedTier('standard')
    setOpen(false)
  }

  const handleClose = () => {
    setResult(null)
    setSelectedTier('standard')
    setOpen(false)
  }

  const currentTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || items.length === 0}>
          <Layers className="h-4 w-4 mr-2" />
          Générer 3 versions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Devis comparatif automatique
          </DialogTitle>
          <DialogDescription>
            Générez 3 versions de votre devis : Économique, Standard et Premium
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Generate button (before generation) */}
          {!result && !isLoading && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">Devis actuel</p>
                <p className="text-2xl font-bold">{formatCurrency(currentTotal)} HT</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {items.length} ligne(s)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg border">
                  <TrendingDown className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Éco</p>
                  <p className="text-xs text-muted-foreground">-20 à -30%</p>
                </div>
                <div className="p-4 rounded-lg border border-primary">
                  <Minus className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Standard</p>
                  <p className="text-xs text-muted-foreground">Base</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                  <p className="font-medium">Premium</p>
                  <p className="text-xs text-muted-foreground">+30 à +50%</p>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer les 3 versions
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Génération en cours...</p>
              <p className="text-sm text-muted-foreground">
                Création des versions Éco, Standard et Premium
              </p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Explanation */}
              {result.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  <p>{result.explanation}</p>
                </div>
              )}

              {/* Variants selection */}
              <RadioGroup
                value={selectedTier}
                onValueChange={(value) => setSelectedTier(value as 'eco' | 'standard' | 'premium')}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {result.variants.map((variant) => {
                  const config = TIER_CONFIG[variant.tier]
                  const Icon = config.icon
                  const isSelected = selectedTier === variant.tier
                  const diff = variant.totalHT - currentTotal
                  const diffPercent = ((diff / currentTotal) * 100).toFixed(0)

                  return (
                    <div
                      key={variant.tier}
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        isSelected
                          ? `${config.borderColor} ${config.bgColor}`
                          : 'border-muted hover:border-muted-foreground/50'
                      }`}
                      onClick={() => setSelectedTier(variant.tier)}
                    >
                      <RadioGroupItem
                        value={variant.tier}
                        id={variant.tier}
                        className="sr-only"
                      />

                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <Label
                            htmlFor={variant.tier}
                            className="font-semibold cursor-pointer"
                          >
                            {variant.name}
                          </Label>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      {/* Price */}
                      <div className="mb-3">
                        <p className="text-2xl font-bold">
                          {formatCurrency(variant.totalHT)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">HT</span>
                        </p>
                        <p className={`text-sm ${diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diff > 0 ? '+' : ''}{diffPercent}%)
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-3">
                        {variant.description}
                      </p>

                      {/* Highlights */}
                      <div className="space-y-1">
                        {variant.highlights.slice(0, 3).map((highlight, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <Star className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>

                      {/* Items count */}
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        {variant.items.length} ligne(s)
                      </p>
                    </div>
                  )
                })}
              </RadioGroup>

              {/* Selected variant details */}
              {result.variants.find((v) => v.tier === selectedTier) && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Détail de la version sélectionnée</p>
                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-4 space-y-2">
                      {result.variants
                        .find((v) => v.tier === selectedTier)
                        ?.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between text-sm py-2 border-b last:border-0"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-medium">{item.description}</p>
                              <p className="text-muted-foreground text-xs">
                                {item.quantity} × {formatCurrency(item.unit_price_ht)} • TVA {item.vat_rate}%
                              </p>
                            </div>
                            <p className="font-medium whitespace-nowrap">
                              {formatCurrency(item.quantity * item.unit_price_ht)}
                            </p>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          {result ? (
            <>
              <Button variant="outline" onClick={() => setResult(null)}>
                Régénérer
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleApply}>
                <Check className="h-4 w-4 mr-2" />
                Appliquer cette version
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
