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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wand2, Loader2, Sparkles, Check, X, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface SmartEditSheetProps {
  items: QuoteItem[]
  onApplyChanges: (newItems: QuoteItem[]) => void
  disabled?: boolean
}

interface SmartEditResult {
  items: QuoteItem[]
  explanation?: string
}

const EXAMPLE_INSTRUCTIONS = [
  'Remplace le robinet par un mitigeur',
  'Ajoute une ligne protection chantier',
  'Augmente les quantités de 20%',
  'Remise de 10%',
]

export function SmartEditSheet({ items, onApplyChanges, disabled }: SmartEditSheetProps) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<SmartEditResult | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const handleGeneratePreview = async () => {
    if (!instruction.trim() || instruction.length < 5) {
      toast.error('Veuillez entrer une instruction plus détaillée')
      return
    }

    setIsLoading(true)
    setPreview(null)

    try {
      const response = await fetch('/api/ai/smart-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          currentItems: items,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      const result: SmartEditResult = await response.json()
      setPreview(result)
    } catch (error) {
      console.error('Erreur modification intelligente:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (!preview) return

    onApplyChanges(preview.items)
    toast.success('Modifications appliquées', {
      description: preview.explanation || 'Le devis a été mis à jour'
    })

    // Reset state
    setInstruction('')
    setPreview(null)
    setOpen(false)
  }

  const handleCancel = () => {
    setInstruction('')
    setPreview(null)
    setOpen(false)
  }

  const calculateTotal = (itemList: QuoteItem[]) => {
    return itemList.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0)
  }

  const currentTotal = calculateTotal(items)
  const previewTotal = preview ? calculateTotal(preview.items) : 0
  const totalDiff = preview ? previewTotal - currentTotal : 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled || items.length === 0}>
          <Wand2 className="h-4 w-4 mr-2" />
          Modifier avec l'IA
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Modification intelligente
          </SheetTitle>
          <SheetDescription>
            Décrivez les modifications souhaitées
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Input instruction */}
          <div className="space-y-3">
            <Textarea
              placeholder="Ex: Remplace le robinet par un mitigeur..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_INSTRUCTIONS.map((example, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer active:scale-95 transition-transform text-xs"
                  onClick={() => setInstruction(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Generate button */}
          {!preview && (
            <Button
              onClick={handleGeneratePreview}
              disabled={isLoading || instruction.length < 5}
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Générer l'aperçu
                </>
              )}
            </Button>
          )}

          {/* Preview */}
          {preview && (
            <ScrollArea className="h-[calc(90vh-400px)]">
              <div className="space-y-4 pr-4">
                {/* Explanation */}
                {preview.explanation && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Modifications :</p>
                    <p>{preview.explanation}</p>
                  </div>
                )}

                {/* Before */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Avant</p>
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.quantity} × {formatCurrency(item.unit_price_ht)}
                        </p>
                      </div>
                    ))}
                    <p className="text-sm font-semibold text-right pt-2 border-t">
                      Total: {formatCurrency(currentTotal)} HT
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <ArrowDown className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* After */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">Après modification</p>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-2 border border-green-200 dark:border-green-800">
                    {preview.items.map((item) => (
                      <div key={item.id} className="text-sm">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.quantity} × {formatCurrency(item.unit_price_ht)}
                        </p>
                      </div>
                    ))}
                    <p className="text-sm font-semibold text-right pt-2 border-t border-green-200 dark:border-green-800">
                      Total: {formatCurrency(previewTotal)} HT
                      {totalDiff !== 0 && (
                        <span className={`ml-2 ${totalDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({totalDiff > 0 ? '+' : ''}{formatCurrency(totalDiff)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <SheetFooter className="flex gap-2 pt-4 mt-4 border-t">
          {preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)} className="flex-1">
                Modifier
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleApply} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Fermer
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
