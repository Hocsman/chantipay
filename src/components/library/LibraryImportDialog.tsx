'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

interface LibraryImportDialogProps {
  onImportItems: (items: LibraryItem[]) => void
  currentTrade?: string
}

/**
 * Composant Desktop : Dialog pour importer des lignes depuis la bibliothèque
 */
export function LibraryImportDialog({ onImportItems, currentTrade }: LibraryImportDialogProps) {
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

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Bibliothèque ({itemCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Importer depuis ma bibliothèque
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les lignes à ajouter au devis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTrade} onValueChange={setFilterTrade}>
              <SelectTrigger className="w-48">
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

          {/* Sélection */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedIds.size === filteredItems.length && filteredItems.length > 0
                ? 'Tout désélectionner'
                : 'Tout sélectionner'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} sélectionné(s)
            </span>
          </div>

          {/* Liste */}
          <ScrollArea className="h-[350px] pr-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune ligne trouvée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getTradeLabel(item.trade)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {item.unit_price_ht.toFixed(2)} € HT
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({item.vat_rate}% TVA)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Action */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={selectedIds.size === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Importer {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
