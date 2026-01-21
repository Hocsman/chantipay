'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Minus, Edit2, Equal, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

interface DiffItem {
  type: DiffType
  before?: QuoteItem
  after?: QuoteItem
  changes?: {
    field: string
    oldValue: string | number
    newValue: string | number
  }[]
}

interface QuoteDiffViewProps {
  before: QuoteItem[]
  after: QuoteItem[]
  className?: string
}

const DIFF_CONFIG = {
  added: {
    icon: Plus,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
    badge: 'Ajouté',
    badgeVariant: 'default' as const,
  },
  removed: {
    icon: Minus,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300',
    badge: 'Supprimé',
    badgeVariant: 'destructive' as const,
  },
  modified: {
    icon: Edit2,
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    textColor: 'text-amber-700 dark:text-amber-300',
    badge: 'Modifié',
    badgeVariant: 'secondary' as const,
  },
  unchanged: {
    icon: Equal,
    bgColor: 'bg-muted/30',
    borderColor: 'border-muted',
    textColor: 'text-muted-foreground',
    badge: 'Inchangé',
    badgeVariant: 'outline' as const,
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function compareItems(before: QuoteItem, after: QuoteItem): DiffItem['changes'] {
  const changes: DiffItem['changes'] = []

  if (before.description !== after.description) {
    changes.push({
      field: 'Description',
      oldValue: before.description,
      newValue: after.description,
    })
  }

  if (before.quantity !== after.quantity) {
    changes.push({
      field: 'Quantité',
      oldValue: before.quantity,
      newValue: after.quantity,
    })
  }

  if (before.unit_price_ht !== after.unit_price_ht) {
    changes.push({
      field: 'Prix HT',
      oldValue: before.unit_price_ht,
      newValue: after.unit_price_ht,
    })
  }

  if (before.vat_rate !== after.vat_rate) {
    changes.push({
      field: 'TVA',
      oldValue: `${before.vat_rate}%`,
      newValue: `${after.vat_rate}%`,
    })
  }

  return changes.length > 0 ? changes : undefined
}

function computeDiff(before: QuoteItem[], after: QuoteItem[]): DiffItem[] {
  const diff: DiffItem[] = []
  const processedAfterIds = new Set<string>()

  // Process items that existed before
  for (const beforeItem of before) {
    const afterItem = after.find((a) => a.id === beforeItem.id)

    if (!afterItem) {
      // Item was removed
      diff.push({ type: 'removed', before: beforeItem })
    } else {
      processedAfterIds.add(afterItem.id)
      const changes = compareItems(beforeItem, afterItem)

      if (changes) {
        // Item was modified
        diff.push({ type: 'modified', before: beforeItem, after: afterItem, changes })
      } else {
        // Item is unchanged
        diff.push({ type: 'unchanged', before: beforeItem, after: afterItem })
      }
    }
  }

  // Process new items (in after but not in before)
  for (const afterItem of after) {
    if (!processedAfterIds.has(afterItem.id)) {
      // Check if it's a truly new item (ID starts with 'new-')
      const matchingBefore = before.find(
        (b) => b.description === afterItem.description && !after.some((a) => a.id === b.id)
      )

      if (matchingBefore) {
        // This might be a renamed/replaced item
        const changes = compareItems(matchingBefore, afterItem)
        diff.push({ type: 'modified', before: matchingBefore, after: afterItem, changes })
      } else {
        // Truly new item
        diff.push({ type: 'added', after: afterItem })
      }
    }
  }

  // Sort: removed first, then modified, then added, then unchanged
  const order: Record<DiffType, number> = {
    removed: 0,
    modified: 1,
    added: 2,
    unchanged: 3,
  }

  return diff.sort((a, b) => order[a.type] - order[b.type])
}

export function QuoteDiffView({ before, after, className }: QuoteDiffViewProps) {
  const diffItems = useMemo(() => computeDiff(before, after), [before, after])

  const summary = useMemo(() => {
    const added = diffItems.filter((d) => d.type === 'added').length
    const removed = diffItems.filter((d) => d.type === 'removed').length
    const modified = diffItems.filter((d) => d.type === 'modified').length
    const unchanged = diffItems.filter((d) => d.type === 'unchanged').length

    const beforeTotal = before.reduce((sum, i) => sum + i.quantity * i.unit_price_ht, 0)
    const afterTotal = after.reduce((sum, i) => sum + i.quantity * i.unit_price_ht, 0)
    const totalDiff = afterTotal - beforeTotal

    return { added, removed, modified, unchanged, beforeTotal, afterTotal, totalDiff }
  }, [diffItems, before, after])

  if (diffItems.length === 0) {
    return (
      <div className={cn('text-center text-muted-foreground py-4', className)}>
        Aucune modification détectée
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
        {summary.added > 0 && (
          <Badge variant="default" className="bg-green-600">
            <Plus className="h-3 w-3 mr-1" />
            {summary.added} ajouté(s)
          </Badge>
        )}
        {summary.modified > 0 && (
          <Badge variant="secondary">
            <Edit2 className="h-3 w-3 mr-1" />
            {summary.modified} modifié(s)
          </Badge>
        )}
        {summary.removed > 0 && (
          <Badge variant="destructive">
            <Minus className="h-3 w-3 mr-1" />
            {summary.removed} supprimé(s)
          </Badge>
        )}
        {summary.unchanged > 0 && (
          <Badge variant="outline">
            {summary.unchanged} inchangé(s)
          </Badge>
        )}
      </div>

      {/* Diff items */}
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {diffItems.map((diff, index) => {
            const config = DIFF_CONFIG[diff.type]
            const Icon = config.icon
            const item = diff.after || diff.before!

            return (
              <div
                key={`${diff.type}-${item.id}-${index}`}
                className={cn(
                  'p-3 rounded-lg border',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className={cn('h-4 w-4 flex-shrink-0', config.textColor)} />
                    <span className={cn('font-medium text-sm truncate', config.textColor)}>
                      {item.description}
                    </span>
                  </div>
                  <Badge variant={config.badgeVariant} className="text-xs flex-shrink-0">
                    {config.badge}
                  </Badge>
                </div>

                {/* Show changes for modified items */}
                {diff.type === 'modified' && diff.changes && (
                  <div className="space-y-1 mt-2 ml-6">
                    {diff.changes.map((change, ci) => (
                      <div key={ci} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{change.field}:</span>
                        <span className="line-through text-red-500">
                          {typeof change.oldValue === 'number' && change.field === 'Prix HT'
                            ? formatCurrency(change.oldValue)
                            : change.oldValue}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-green-600 font-medium">
                          {typeof change.newValue === 'number' && change.field === 'Prix HT'
                            ? formatCurrency(change.newValue)
                            : change.newValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show item details */}
                <div className="flex items-center justify-between mt-2 ml-6 text-xs text-muted-foreground">
                  <span>
                    {item.quantity} × {formatCurrency(item.unit_price_ht)} • TVA {item.vat_rate}%
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.quantity * item.unit_price_ht)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Total comparison */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="text-sm">
          <span className="text-muted-foreground">Avant:</span>
          <span className="font-medium ml-2">{formatCurrency(summary.beforeTotal)} HT</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-sm">
          <span className="text-muted-foreground">Après:</span>
          <span className="font-semibold ml-2">{formatCurrency(summary.afterTotal)} HT</span>
          {summary.totalDiff !== 0 && (
            <span
              className={cn(
                'ml-2 text-xs',
                summary.totalDiff > 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              ({summary.totalDiff > 0 ? '+' : ''}
              {formatCurrency(summary.totalDiff)})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
