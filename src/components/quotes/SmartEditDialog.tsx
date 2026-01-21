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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Wand2, Loader2, Sparkles, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { QuoteDiffView } from './QuoteDiffView'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface SmartEditDialogProps {
  items: QuoteItem[]
  onApplyChanges: (newItems: QuoteItem[]) => void
  disabled?: boolean
}

interface SmartEditResult {
  items: QuoteItem[]
  explanation?: string
}

const EXAMPLE_INSTRUCTIONS = [
  'Remplace le robinet par un mitigeur thermostatique',
  'Ajoute une ligne pour la protection du chantier',
  'Augmente les quantités de 20%',
  'Applique une remise de 10%',
  'Passe la TVA à 10%',
]

export function SmartEditDialog({ items, onApplyChanges, disabled }: SmartEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<SmartEditResult | null>(null)

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || items.length === 0}>
          <Wand2 className="h-4 w-4 mr-2" />
          Modifier avec l'IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Modification intelligente
          </DialogTitle>
          <DialogDescription>
            Décrivez les modifications souhaitées en langage naturel
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Input instruction */}
          <div className="space-y-2">
            <Textarea
              placeholder="Ex: Remplace le robinet par un mitigeur thermostatique..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_INSTRUCTIONS.slice(0, 3).map((example, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
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
              className="w-full"
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

          {/* Preview with Diff View */}
          {preview && (
            <div className="space-y-4">
              {/* Explanation */}
              {preview.explanation && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Modifications proposées :</p>
                  <p>{preview.explanation}</p>
                </div>
              )}

              {/* Diff View */}
              <QuoteDiffView before={items} after={preview.items} />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          {preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Modifier l'instruction
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleApply}>
                <Check className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleCancel}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
