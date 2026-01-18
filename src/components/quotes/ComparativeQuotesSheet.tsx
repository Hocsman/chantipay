'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Layers,
  Loader2,
  Sparkles,
  Check,
  TrendingDown,
  Minus,
  TrendingUp,
  Star,
  ChevronRight,
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

interface ComparativeQuotesSheetProps {
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
    borderColor: 'border-blue-500',
    label: 'Éco',
  },
  standard: {
    icon: Minus,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-500',
    label: 'Standard',
  },
  premium: {
    icon: TrendingUp,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-500',
    label: 'Premium',
  },
}

export function ComparativeQuotesSheet({
  items,
  onSelectVariant,
  currentTrade,
  disabled,
}: ComparativeQuotesSheetProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateVariantsResult | null>(null)
  const [selectedTier, setSelectedTier] = useState<'eco' | 'standard' | 'premium'>('standard')
  const [showDetails, setShowDetails] = useState(false)

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
      setShowDetails(false)

      toast.success('3 versions générées')
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
    setShowDetails(false)
    setOpen(false)
  }

  const handleClose = () => {
    setResult(null)
    setSelectedTier('standard')
    setShowDetails(false)
    setOpen(false)
  }

  const currentTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)
  const selectedVariant = result?.variants.find((v) => v.tier === selectedTier)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled || items.length === 0}>
          <Layers className="h-4 w-4 mr-2" />
          Générer 3 versions
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Devis comparatif
          </SheetTitle>
          <SheetDescription>
            Éco, Standard ou Premium
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Generate button (before generation) */}
          {!result && !isLoading && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Devis actuel</p>
                <p className="text-2xl font-bold">{formatCurrency(currentTotal)} HT</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {items.length} ligne(s)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-lg border">
                  <TrendingDown className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs font-medium">Éco</p>
                </div>
                <div className="p-3 rounded-lg border border-primary">
                  <Minus className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-xs font-medium">Standard</p>
                </div>
                <div className="p-3 rounded-lg border">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 text-amber-600" />
                  <p className="text-xs font-medium">Premium</p>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full h-12">
                <Sparkles className="h-4 w-4 mr-2" />
                Générer les 3 versions
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="font-medium">Génération en cours...</p>
              <p className="text-sm text-muted-foreground">
                Éco, Standard et Premium
              </p>
            </div>
          )}

          {/* Results - List view */}
          {result && !showDetails && (
            <ScrollArea className="h-[calc(90vh-280px)]">
              <div className="space-y-3 pr-4">
                {result.variants.map((variant) => {
                  const config = TIER_CONFIG[variant.tier]
                  const Icon = config.icon
                  const isSelected = selectedTier === variant.tier
                  const diff = variant.totalHT - currentTotal
                  const diffPercent = ((diff / currentTotal) * 100).toFixed(0)

                  return (
                    <div
                      key={variant.tier}
                      className={`rounded-lg border-2 p-4 active:scale-[0.98] transition-transform ${
                        isSelected
                          ? `${config.borderColor} ${config.bgColor}`
                          : 'border-muted'
                      }`}
                      onClick={() => setSelectedTier(variant.tier)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <span className="font-semibold">{variant.name}</span>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                      </div>

                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-xl font-bold">
                            {formatCurrency(variant.totalHT)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">HT</span>
                          </p>
                          <p className={`text-xs ${diff > 0 ? 'text-amber-600' : diff < 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({diff > 0 ? '+' : ''}{diffPercent}%)
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTier(variant.tier)
                            setShowDetails(true)
                          }}
                        >
                          Détails
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2">
                        {variant.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {variant.highlights.slice(0, 2).map((highlight, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Star className="h-2.5 w-2.5 mr-1 text-amber-500" />
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* Results - Details view */}
          {result && showDetails && selectedVariant && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
                className="mb-2"
              >
                ← Retour aux versions
              </Button>

              <div className={`rounded-lg p-4 ${TIER_CONFIG[selectedTier].bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = TIER_CONFIG[selectedTier].icon
                    return <Icon className={`h-5 w-5 ${TIER_CONFIG[selectedTier].color}`} />
                  })()}
                  <span className="font-semibold">{selectedVariant.name}</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(selectedVariant.totalHT)} HT
                </p>
              </div>

              <ScrollArea className="h-[calc(90vh-450px)]">
                <div className="space-y-2 pr-4">
                  {selectedVariant.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-muted/30 rounded-lg"
                    >
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
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <SheetFooter className="flex gap-2 pt-4 mt-4 border-t">
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setShowDetails(false)
                }}
                className="flex-1"
              >
                Régénérer
              </Button>
              <Button onClick={handleApply} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Appliquer
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
