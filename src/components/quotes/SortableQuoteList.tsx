'use client'

import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableQuoteItem } from './SortableQuoteItem'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface SortableQuoteListProps {
  items: QuoteItem[]
  onItemsChange: (items: QuoteItem[]) => void
  onUpdateItem: (id: string, field: keyof QuoteItem, value: string | number) => void
  onRemoveItem: (id: string) => void
  formatCurrency: (amount: number) => string
  renderItemExtras?: (item: QuoteItem) => React.ReactNode
}

export function SortableQuoteList({
  items,
  onItemsChange,
  onUpdateItem,
  onRemoveItem,
  formatCurrency,
  renderItemExtras,
}: SortableQuoteListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        onItemsChange(newItems)
      }
    },
    [items, onItemsChange]
  )

  const handleDuplicate = useCallback(
    (id: string) => {
      const itemIndex = items.findIndex((item) => item.id === id)
      if (itemIndex === -1) return

      const itemToDuplicate = items[itemIndex]
      const duplicatedItem: QuoteItem = {
        ...itemToDuplicate,
        id: `dup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }

      // Insert the duplicated item right after the original
      const newItems = [
        ...items.slice(0, itemIndex + 1),
        duplicatedItem,
        ...items.slice(itemIndex + 1),
      ]
      onItemsChange(newItems)
    },
    [items, onItemsChange]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableQuoteItem
              key={item.id}
              item={item}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              onDuplicate={handleDuplicate}
              canRemove={items.length > 1}
              formatCurrency={formatCurrency}
            >
              {renderItemExtras?.(item)}
            </SortableQuoteItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
