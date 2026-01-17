'use client'

import { useState, useRef } from 'react'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Download,
  Upload,
  BookOpen,
  Search,
  Pencil,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuoteLibrary } from '@/hooks/useQuoteLibrary'
import { TRADE_OPTIONS, type LibraryItem } from '@/types/quote-library'

export default function MobileLibraryPage() {
  const {
    library,
    isLoaded,
    addItem,
    updateItem,
    removeItem,
    clearLibrary,
    exportToJSON,
    importFromJSON,
    itemCount,
    maxItems,
  } = useQuoteLibrary()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterTrade, setFilterTrade] = useState<string>('all')
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Formulaire pour nouvel item
  const [newItem, setNewItem] = useState({
    description: '',
    unit_price_ht: 0,
    vat_rate: 20,
    trade: 'autre',
    category: '',
  })

  // Filtrer les items
  const filteredItems = library.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTrade = filterTrade === 'all' || item.trade === filterTrade
    return matchesSearch && matchesTrade
  })

  const handleAddItem = () => {
    if (!newItem.description.trim()) {
      toast.error('La description est requise')
      return
    }

    const result = addItem(newItem)
    if (result.success) {
      toast.success('Ligne ajoutée')
      setNewItem({
        description: '',
        unit_price_ht: 0,
        vat_rate: 20,
        trade: 'autre',
        category: '',
      })
      setIsAddSheetOpen(false)
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  const handleUpdateItem = () => {
    if (!editingItem) return

    updateItem(editingItem.id, {
      description: editingItem.description,
      unit_price_ht: editingItem.unit_price_ht,
      vat_rate: editingItem.vat_rate,
      trade: editingItem.trade,
      category: editingItem.category,
    })
    toast.success('Ligne mise à jour')
    setEditingItem(null)
  }

  const handleDeleteItem = (id: string) => {
    removeItem(id)
    toast.success('Ligne supprimée')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await importFromJSON(file)
    if (result.success) {
      toast.success(`${result.count} ligne(s) importée(s)`)
    } else {
      toast.error(result.error || 'Erreur')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getTradeLabel = (trade: string) => {
    return TRADE_OPTIONS.find((t) => t.value === trade)?.label || trade
  }

  if (!isLoaded) {
    return (
      <MobileLayout title="Ma bibliothèque" subtitle="Chargement...">
        <div className="p-4" />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Ma bibliothèque" subtitle={`${itemCount}/${maxItems} lignes`}>
      <div className="space-y-4 p-4 pb-32">
        {/* Actions */}
        <div className="flex gap-2">
          {/* Bouton Ajouter */}
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>Ajouter une ligne</SheetTitle>
                <SheetDescription>
                  Créez une nouvelle ligne pour votre bibliothèque
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    placeholder="Ex: Installation robinet"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix HT (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unit_price_ht}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          unit_price_ht: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TVA (%)</Label>
                    <Select
                      value={newItem.vat_rate.toString()}
                      onValueChange={(v) =>
                        setNewItem({ ...newItem, vat_rate: parseFloat(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5.5">5,5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Métier</Label>
                  <Select
                    value={newItem.trade}
                    onValueChange={(v) => setNewItem({ ...newItem, trade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_OPTIONS.map((trade) => (
                        <SelectItem key={trade.value} value={trade.value}>
                          {trade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Catégorie (optionnel)</Label>
                  <Input
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    placeholder="Ex: Installation..."
                  />
                </div>
              </div>
              <SheetFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsAddSheetOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleAddItem} className="flex-1">
                  Ajouter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </Button>

          {/* Export */}
          <Button
            variant="outline"
            size="icon"
            onClick={exportToJSON}
            disabled={itemCount === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Recherche et filtre */}
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
              <SelectValue placeholder="Filtrer par métier" />
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

        {/* Liste des items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {itemCount === 0
                ? 'Bibliothèque vide'
                : 'Aucun résultat'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getTradeLabel(item.trade)}
                        </Badge>
                        {item.category && (
                          <span className="text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-2">
                        {item.unit_price_ht.toFixed(2)} € HT
                        <span className="text-muted-foreground ml-2">
                          ({item.vat_rate}% TVA)
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sheet de modification */}
        <Sheet open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Modifier la ligne</SheetTitle>
            </SheetHeader>
            {editingItem && (
              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingItem.description}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix HT (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.unit_price_ht}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          unit_price_ht: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TVA (%)</Label>
                    <Select
                      value={editingItem.vat_rate.toString()}
                      onValueChange={(v) =>
                        setEditingItem({ ...editingItem, vat_rate: parseFloat(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5.5">5,5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Métier</Label>
                  <Select
                    value={editingItem.trade}
                    onValueChange={(v) => setEditingItem({ ...editingItem, trade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_OPTIONS.map((trade) => (
                        <SelectItem key={trade.value} value={trade.value}>
                          {trade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <SheetFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingItem(null)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleUpdateItem} className="flex-1">
                Enregistrer
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </MobileLayout>
  )
}
