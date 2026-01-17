'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BookOpen, Search, Plus } from 'lucide-react'
import { useQuoteLibrary } from '@/hooks/useQuoteLibrary'
import { TRADE_OPTIONS, type LibraryItem } from '@/types/quote-library'

interface LibraryImportSheetProps {
  onImportItems: (items: LibraryItem[]) => void
  currentTrade?: string
}

/**
 * Composant Mobile : Sheet pour importer des lignes depuis la bibliothèque
 */
export function LibraryImportSheet({ onImportItems, currentTrade }: LibraryImportSheetProps) {
  const { library, itemCount } = useQuoteLibrary()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTrade, setFilterTrade] = useState<string>(currentTrade || 'all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Filtrer les items
  const filteredItems = useMemo(() => {
    return library.filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTrade = filterTrade === 'all' || item.trade === filterTrade
      return matchesSearch && matchesTrade
    })
  }, [library, searchQuery, filterTrade])

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const handleImport = () => {
    const itemsToImport = library.filter((item) => selectedIds.has(item.id))
    onImportItems(itemsToImport)
    setSelectedIds(new Set())
    setOpen(false)
  }

  const getTradeLabel = (trade: string) => {
    return TRADE_OPTIONS.find((t) => t.value === trade)?.label || trade
  }

  if (itemCount === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <BookOpen className="h-4 w-4 mr-2" />
          Bibliothèque ({itemCount})
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Ma bibliothèque
          </SheetTitle>
          <SheetDescription>
            Sélectionnez les lignes à ajouter
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Filtres */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTrade} onValueChange={setFilterTrade}>
              <SelectTrigger>
                <SelectValue placeholder="Métier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les métiers</SelectItem>
                {TRADE_OPTIONS.map((trade) => (
                  <SelectItem key={trade.value} value={trade.value}>
                    {trade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compteur */}
          <div className="text-sm text-muted-foreground text-center">
            {selectedIds.size} ligne(s) sélectionnée(s)
          </div>

          {/* Liste */}
          <ScrollArea className="h-[calc(90vh-320px)]">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune ligne trouvée</p>
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors active:scale-[0.98] ${
                      selectedIds.has(item.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelection(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getTradeLabel(item.trade)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {item.unit_price_ht.toFixed(2)} € HT
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Action */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={selectedIds.size === 0} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Importer {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
