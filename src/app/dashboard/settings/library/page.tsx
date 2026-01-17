'use client'

import { useState, useRef } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Download,
  Upload,
  BookOpen,
  Search,
  Pencil,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuoteLibrary } from '@/hooks/useQuoteLibrary'
import { TRADE_OPTIONS, type LibraryItem } from '@/types/quote-library'
import Link from 'next/link'

export default function LibraryPage() {
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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
      toast.success('Ligne ajoutée à la bibliothèque')
      setNewItem({
        description: '',
        unit_price_ht: 0,
        vat_rate: 20,
        trade: 'autre',
        category: '',
      })
      setIsAddDialogOpen(false)
    } else {
      toast.error(result.error || 'Erreur lors de l\'ajout')
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
      toast.error(result.error || 'Erreur lors de l\'import')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearLibrary = () => {
    if (confirm('Êtes-vous sûr de vouloir vider toute la bibliothèque ?')) {
      clearLibrary()
      toast.success('Bibliothèque vidée')
    }
  }

  const getTradeLabel = (trade: string) => {
    return TRADE_OPTIONS.find((t) => t.value === trade)?.label || trade
  }

  if (!isLoaded) {
    return (
      <LayoutContainer>
        <PageHeader title="Ma bibliothèque" description="Chargement..." />
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Ma bibliothèque"
        description="Gérez vos lignes de devis favorites"
      />

      <div className="space-y-6">
        {/* Retour aux paramètres */}
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux paramètres
          </Button>
        </Link>

        {/* Actions et stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Bibliothèque personnelle
            </CardTitle>
            <CardDescription>
              {itemCount} / {maxItems} lignes enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Bouton Ajouter */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une ligne</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle ligne pour votre bibliothèque
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Input
                        value={newItem.description}
                        onChange={(e) =>
                          setNewItem({ ...newItem, description: e.target.value })
                        }
                        placeholder="Ex: Installation robinet mitigeur"
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
                        placeholder="Ex: Installation, Réparation..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddItem}>Ajouter</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Import JSON */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer JSON
              </Button>

              {/* Export JSON */}
              <Button
                variant="outline"
                onClick={exportToJSON}
                disabled={itemCount === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter JSON
              </Button>

              {/* Vider */}
              {itemCount > 0 && (
                <Button variant="destructive" onClick={handleClearLibrary}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
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
            <SelectTrigger className="w-full sm:w-48">
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
        <Card>
          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {itemCount === 0
                    ? 'Votre bibliothèque est vide'
                    : 'Aucun résultat pour cette recherche'}
                </p>
                {itemCount === 0 && (
                  <p className="text-sm mt-2">
                    Ajoutez vos premières lignes de devis favorites
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Description</TableHead>
                      <TableHead className="w-24">Métier</TableHead>
                      <TableHead className="w-24 text-right">Prix HT</TableHead>
                      <TableHead className="w-16 text-right">TVA</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.category}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getTradeLabel(item.trade)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.unit_price_ht.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right">{item.vat_rate}%</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de modification */}
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la ligne</DialogTitle>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4 py-4">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateItem}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutContainer>
  )
}
