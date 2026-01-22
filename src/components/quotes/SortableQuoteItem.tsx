'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GripVertical, Trash2, Copy } from 'lucide-react'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface SortableQuoteItemProps {
  item: QuoteItem
  onUpdate: (id: string, field: keyof QuoteItem, value: string | number) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  canRemove: boolean
  formatCurrency: (amount: number) => string
  children?: React.ReactNode
}

export function SortableQuoteItem({
  item,
  onUpdate,
  onRemove,
  onDuplicate,
  canRemove,
  formatCurrency,
  children,
}: SortableQuoteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
    >
      <CardContent className="pt-4">
        {/* Drag handle + actions */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDuplicate(item.id)}
              title="Dupliquer cette ligne"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
              disabled={!canRemove}
              title="Supprimer cette ligne"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <Input
            placeholder="Description de la prestation"
            value={item.description}
            onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
          />
        </div>

        {/* Quantity, Price, VAT */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-xs text-muted-foreground">Qté</label>
            <Input
              type="number"
              min="1"
              value={item.quantity || ''}
              placeholder="1"
              className="text-center"
              onChange={(e) =>
                onUpdate(item.id, 'quantity', parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Prix HT</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price_ht || ''}
              placeholder="0.00"
              onChange={(e) =>
                onUpdate(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">TVA %</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={item.vat_rate || ''}
              placeholder="20"
              className="text-center"
              onChange={(e) =>
                onUpdate(item.id, 'vat_rate', parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Total */}
        <div className="text-right text-sm">
          Total: <strong>{formatCurrency(item.quantity * item.unit_price_ht)}</strong> HT
        </div>

        {/* Additional content (e.g., price hints) */}
        {children}
      </CardContent>
    </Card>
  )
}
