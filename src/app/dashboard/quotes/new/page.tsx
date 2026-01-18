'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Sparkles, Loader2, Check, Replace, PlusCircle, Car, Package, Clock, AlertTriangle, Construction, Zap, Droplets, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useQuoteAutoSave, formatSavedAt } from '@/hooks/useQuoteAutoSave'
import {
  validateQuoteItems,
  validateDepositPercent,
  sanitizeQuoteItem,
  VALIDATION_RULES,
} from '@/lib/validation/quoteValidation'
import { QuoteCreationTracker, QuoteAITracker } from '@/lib/analytics/quoteAnalytics'
import { useAIHistory } from '@/hooks/useAIHistory'
import { AIHistoryDropdown } from '@/components/ai/AIHistoryDropdown'
import { TemplateSelector } from '@/components/templates/TemplateSelector'
import type { QuoteTemplate } from '@/lib/templates/quoteTemplates'
import { PriceAdjustmentDialog } from '@/components/quotes/PriceAdjustmentDialog'
import { PhotoAnalysisDialog } from '@/components/quotes/PhotoAnalysisDialog'
import { ComparativeQuotesDialog } from '@/components/quotes/ComparativeQuotesDialog'
import { LibraryImportDialog } from '@/components/library/LibraryImportDialog'
import { useQuoteLibrary } from '@/hooks/useQuoteLibrary'
import type { LibraryItem } from '@/types/quote-library'

// ===========================================
// Types
// ===========================================
interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
}

// ===========================================
// Helper Chips Configuration
// ===========================================
interface HelperChip {
  id: string
  label: string
  icon: React.ReactNode
  appendText: string
}

const helperChips: HelperChip[] = [
  {
    id: 'deplacement',
    label: 'Déplacement',
    icon: <Car className="h-3 w-3" />,
    appendText: 'Inclure les frais de déplacement.',
  },
  {
    id: 'fourniture',
    label: 'Fourniture',
    icon: <Package className="h-3 w-3" />,
    appendText: 'Inclure la fourniture du matériel et consommables.',
  },
  {
    id: 'main-oeuvre',
    label: 'Main d\'œuvre',
    icon: <Clock className="h-3 w-3" />,
    appendText: 'Détailler la main d\'œuvre (temps estimé).',
  },
  {
    id: 'urgence',
    label: 'Urgence',
    icon: <AlertTriangle className="h-3 w-3" />,
    appendText: 'Intervention urgente, prévoir majoration si nécessaire.',
  },
  {
    id: 'acces-difficile',
    label: 'Accès difficile',
    icon: <Construction className="h-3 w-3" />,
    appendText: 'Accès difficile / contraintes sur place (à préciser).',
  },
]

// ===========================================
// Quick Examples
// ===========================================
const exampleDescriptions = {
  plomberie: `Remplacement d'un chauffe-eau électrique de 200L dans une salle de bain.
- Dépose de l'ancien ballon et évacuation
- Fourniture et pose du nouveau chauffe-eau
- Raccordements eau froide, eau chaude et électrique
- Mise en service et vérification de l'installation
Inclure les frais de déplacement.`,
  electricite: `Installation d'un tableau électrique neuf dans une maison individuelle.
- Dépose de l'ancien tableau vétuste
- Fourniture et pose d'un tableau 3 rangées avec disjoncteurs
- Reprise des circuits existants et mise aux normes
- Pose d'un interrupteur différentiel 30mA
- Contrôle et tests de l'installation
Détailler la main d'œuvre (temps estimé).
Inclure la fourniture du matériel et consommables.`,
}

// ===========================================
// Trade Options
// ===========================================
const tradeOptions = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'renovation', label: 'Rénovation' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'autre', label: 'Autre' },
]

export default function NewQuotePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clients, setClients] = useState<Client[]>([])

  // État du formulaire
  const [selectedClientId, setSelectedClientId] = useState('')
  const [vatRate, setVatRate] = useState('20')
  const [depositPercent, setDepositPercent] = useState('30')
  const [aiDescription, setAiDescription] = useState('')
  const [selectedTrade, setSelectedTrade] = useState('')
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set())
  const [replaceMode, setReplaceMode] = useState(true) // true = replace, false = append
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unit_price_ht: 0, vat_rate: 20 },
  ])

  // Auto-save hook (sauvegarde automatique en arrière-plan)
  const { clearDraft } = useQuoteAutoSave(
    selectedClientId,
    vatRate,
    depositPercent,
    items,
    aiDescription,
    selectedTrade,
    true // enabled
  )

  // Analytics trackers
  const [quoteTracker] = useState(() => new QuoteCreationTracker())
  const [aiTracker] = useState(() => new QuoteAITracker())

  // AI History
  const { history, addToHistory, restoreFromHistory, removeFromHistory, clearHistory } = useAIHistory()

  // Charger les clients au montage
  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Erreur chargement clients:', error)
      } finally {
        setIsLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  // Toggle helper chip
  const toggleChip = useCallback((chip: HelperChip) => {
    setSelectedChips(prev => {
      const next = new Set(prev)
      if (next.has(chip.id)) {
        next.delete(chip.id)
        // Remove the append text from description
        setAiDescription(desc => 
          desc.replace(chip.appendText, '').replace(/\n{3,}/g, '\n\n').trim()
        )
      } else {
        next.add(chip.id)
        // Add the append text to description
        setAiDescription(desc => {
          const trimmed = desc.trim()
          return trimmed ? `${trimmed}\n${chip.appendText}` : chip.appendText
        })
      }
      return next
    })
  }, [])

  // Fill example description
  const fillExample = useCallback((type: 'plomberie' | 'electricite') => {
    setAiDescription(exampleDescriptions[type])
    setSelectedTrade(type)
    // Reset chips
    setSelectedChips(new Set())
  }, [])

  // Restore from AI history
  const handleRestoreFromHistory = useCallback((entry: any) => {
    // Restore description and trade
    setAiDescription(entry.description)
    if (entry.trade) setSelectedTrade(entry.trade)
    if (entry.vatRate) setVatRate(entry.vatRate.toString())

    // Restore items
    const restoredItems: QuoteItem[] = entry.items.map((item: any, index: number) => ({
      id: `restored-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
    }))

    setItems(restoredItems)
    toast.success('Génération restaurée depuis l\'historique')
  }, [])

  // Use template
  const handleSelectTemplate = useCallback((template: QuoteTemplate) => {
    setAiDescription(template.description)
    setSelectedTrade(template.trade)
    setSelectedChips(new Set())
    toast.success(`Template "${template.title}" chargé`)
  }, [])

  // Import from library
  const handleImportFromLibrary = useCallback((libraryItems: LibraryItem[]) => {
    const newItems: QuoteItem[] = libraryItems.map((libItem, index) => ({
      id: `lib-import-${Date.now()}-${index}`,
      description: libItem.description,
      quantity: 1,
      unit_price_ht: libItem.unit_price_ht,
      vat_rate: libItem.vat_rate,
    }))
    setItems((prev) => [...prev, ...newItems])
    toast.success(`${libraryItems.length} ligne(s) importée(s) depuis la bibliothèque`)
  }, [])

  // Import from photo analysis
  const handlePhotoAnalysisItems = useCallback((photoItems: Omit<QuoteItem, 'id'>[]) => {
    const newItems: QuoteItem[] = photoItems.map((item, index) => ({
      id: `photo-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [])

  // Apply variant from comparative quotes
  const handleSelectVariant = useCallback((variantItems: QuoteItem[]) => {
    const newItems: QuoteItem[] = variantItems.map((item, index) => ({
      id: `variant-${Date.now()}-${index}`,
      description: item.description,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
    }))
    setItems(newItems)
  }, [])

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit_price_ht: 0,
      vat_rate: parseFloat(vatRate),
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Calculs des totaux
  const calculateTotals = () => {
    let totalHT = 0
    let totalVAT = 0

    items.forEach((item) => {
      const lineHT = item.quantity * item.unit_price_ht
      const lineVAT = lineHT * (item.vat_rate / 100)
      totalHT += lineHT
      totalVAT += lineVAT
    })

    const totalTTC = totalHT + totalVAT
    const depositAmount = totalTTC * (parseFloat(depositPercent) / 100)

    return { totalHT, totalVAT, totalTTC, depositAmount }
  }

  const { totalHT, totalVAT, totalTTC, depositAmount } = calculateTotals()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Génération IA des lignes de devis
  const generateWithAI = async () => {
    if (!aiDescription.trim()) {
      toast.error('Veuillez décrire les travaux à réaliser')
      return
    }

    if (aiDescription.trim().length < 20) {
      toast.error('La description doit contenir au moins 20 caractères')
      return
    }

    // Analytics: Démarrer le tracking de génération IA
    aiTracker.start(selectedTrade)

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          trade: selectedTrade || undefined,
          vat_rate: parseFloat(vatRate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }
      
      if (data.items && Array.isArray(data.items)) {
        const newItems: QuoteItem[] = data.items.map((item: Omit<QuoteItem, 'id'>, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          description: item.description,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          vat_rate: item.vat_rate || parseFloat(vatRate),
        }))

        if (replaceMode) {
          // Replace all lines
          setItems(newItems)
        } else {
          // Append to existing lines (filter out empty ones first)
          const existingNonEmpty = items.filter(item => item.description.trim())
          if (existingNonEmpty.length === 0) {
            setItems(newItems)
          } else {
            setItems([...existingNonEmpty, ...newItems])
          }
        }

        toast.success('Lignes générées ! Vous pouvez ajuster les prix.')

        // Analytics: Succès de la génération IA
        aiTracker.success()

        // Ajouter à l'historique
        addToHistory(aiDescription, newItems, selectedTrade, parseFloat(vatRate))
      }
    } catch (error) {
      console.error('Erreur génération IA:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération')

      // Analytics: Erreur de génération IA
      aiTracker.error(
        'ai_generation_failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    // Filtrer les lignes vides
    const validItems = items.filter(item => item.description.trim())

    if (validItems.length === 0) {
      toast.error('Veuillez ajouter au moins une ligne au devis')
      return
    }

    // Valider l'acompte
    const depositValidation = validateDepositPercent(parseFloat(depositPercent))
    if (!depositValidation.isValid) {
      toast.error(depositValidation.errors[0])

      // Analytics: Erreur de validation
      quoteTracker.error('validation_error', depositValidation.errors[0], 'validation')
      return
    }

    // Nettoyer et sanitizer les items
    const sanitizedItems = validItems.map(sanitizeQuoteItem)

    // Validation avancée avec messages détaillés
    const validation = validateQuoteItems(sanitizedItems)
    if (!validation.isValid) {
      // Afficher la première erreur
      toast.error(validation.errors[0])

      // Analytics: Erreur de validation
      quoteTracker.error('validation_error', validation.errors[0], 'validation')
      return
    }

    // Analytics: Démarrer le tracking de création
    const hasAI = aiDescription.trim().length > 0
    quoteTracker.start(sanitizedItems.length, hasAI)

    setIsLoading(true)
    try {
      // Préparer les items pour l'API (sans l'id client)
      const cleanedItems = sanitizedItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        vat_rate: item.vat_rate,
      }))

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          vat_rate: parseFloat(vatRate),
          deposit_percent: parseFloat(depositPercent),
          items: cleanedItems,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du devis')
      }

      toast.success('Devis créé avec succès !')

      // Analytics: Succès de la création
      quoteTracker.success(sanitizedItems.length)

      // Supprimer le brouillon sauvegardé
      clearDraft()

      // Rediriger vers le devis créé
      router.push(`/dashboard/quotes/${data.quote.id}`)
    } catch (error) {
      console.error('Erreur création devis:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du devis')

      // Analytics: Erreur lors de l'appel API
      quoteTracker.error(
        'api_error',
        error instanceof Error ? error.message : 'Unknown API error',
        'api_call'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Nouveau devis"
        description="Créez un nouveau devis pour votre client"
      />

      <div className="space-y-6">
        {/* Étape 1: Sélection du client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Client</CardTitle>
            <CardDescription>Sélectionnez ou créez un client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isLoadingClients}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={isLoadingClients ? "Chargement..." : clients.length === 0 ? "Aucun client - créez-en un" : "Sélectionner un client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Étape 2: Paramètres */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Paramètres</CardTitle>
            <CardDescription>Configurez le taux de TVA et l&apos;acompte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vatRate">Taux de TVA (%)</Label>
                <Select value={vatRate} onValueChange={setVatRate}>
                  <SelectTrigger id="vatRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5.5">5,5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="depositPercent">Acompte (%)</Label>
                <Select value={depositPercent} onValueChange={setDepositPercent}>
                  <SelectTrigger id="depositPercent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pas d&apos;acompte</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Étape 3: Lignes du devis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Lignes du devis</CardTitle>
            <CardDescription>Ajoutez les prestations et fournitures</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Vue mobile */}
            <div className="space-y-4 md:hidden">
              {items.map((item, index) => (
                <Card key={item.id} className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ligne {index + 1}</span>
                      <div className="flex gap-1">
                        <PriceAdjustmentDialog
                          description={item.description}
                          quantity={item.quantity}
                          currentPrice={item.unit_price_ht}
                          onApplyPrice={(newPrice) => updateItem(item.id, 'unit_price_ht', newPrice)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description de la prestation"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Qté</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Prix HT</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price_ht}
                          onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>TVA %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.vat_rate}
                          onChange={(e) => updateItem(item.id, 'vat_rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      Total: <strong>{formatCurrency(item.quantity * item.unit_price_ht)}</strong> HT
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Vue desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[300px]">Description</TableHead>
                    <TableHead className="w-20">Qté</TableHead>
                    <TableHead className="w-28">Prix HT</TableHead>
                    <TableHead className="w-20">TVA %</TableHead>
                    <TableHead className="w-28 text-right">Total HT</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Description de la prestation"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price_ht}
                          onChange={(e) => updateItem(item.id, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.vat_rate}
                          onChange={(e) => updateItem(item.id, 'vat_rate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price_ht)}
                      </TableCell>
                      <TableCell>
                        <PriceAdjustmentDialog
                          description={item.description}
                          quantity={item.quantity}
                          currentPrice={item.unit_price_ht}
                          onApplyPrice={(newPrice) => updateItem(item.id, 'unit_price_ht', newPrice)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <Button variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
              <LibraryImportDialog
                onImportItems={handleImportFromLibrary}
                currentTrade={selectedTrade}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section IA */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assistant IA
            </CardTitle>
            <CardDescription>
              Décrivez le chantier et laissez l&apos;IA générer les lignes du devis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Examples + Templates */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Exemples rapides</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillExample('plomberie')}
                    className="h-8"
                  >
                    <Droplets className="h-3 w-3 mr-1.5" />
                    Exemple plomberie
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillExample('electricite')}
                    className="h-8"
                  >
                    <Zap className="h-3 w-3 mr-1.5" />
                    Exemple électricité
                  </Button>
                  <TemplateSelector
                    selectedTrade={selectedTrade}
                    onSelectTemplate={handleSelectTemplate}
                  />
                </div>
              </div>

              {/* Trade Selection */}
              <div>
                <Label htmlFor="trade">Métier (optionnel)</Label>
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger id="trade" className="mt-1">
                    <SelectValue placeholder="Sélectionner un métier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="aiDescription">Décrivez les travaux</Label>
                  <span className={`text-xs ${aiDescription.length > 1800 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {aiDescription.length}/2000
                  </span>
                </div>
                <Textarea
                  id="aiDescription"
                  value={aiDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      setAiDescription(e.target.value)
                    }
                  }}
                  placeholder="Ex: Installation d'un ballon d'eau chaude de 200L en remplacement d'un ancien cumulus, avec dépose de l'ancien équipement..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Helper Chips */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Ajouter des précisions (cliquez pour activer/désactiver)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {helperChips.map((chip) => (
                    <Badge
                      key={chip.id}
                      variant={selectedChips.has(chip.id) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors py-1.5 px-3 ${
                        selectedChips.has(chip.id)
                          ? 'bg-primary hover:bg-primary/90'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleChip(chip)}
                    >
                      {chip.icon}
                      <span className="ml-1.5">{chip.label}</span>
                      {selectedChips.has(chip.id) && (
                        <Check className="h-3 w-3 ml-1.5" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Replace/Append Toggle */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-background border">
                <span className="text-sm text-muted-foreground">Mode :</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={replaceMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReplaceMode(true)}
                    className="h-8"
                  >
                    <Replace className="h-3 w-3 mr-1.5" />
                    Remplacer
                  </Button>
                  <Button
                    type="button"
                    variant={!replaceMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReplaceMode(false)}
                    className="h-8"
                  >
                    <PlusCircle className="h-3 w-3 mr-1.5" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Generate Button + Photo + History */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={generateWithAI}
                  disabled={!aiDescription.trim() || aiDescription.trim().length < 20 || isGeneratingAI}
                  className="flex-1 h-12 text-base"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Générer les lignes
                    </>
                  )}
                </Button>

                <PhotoAnalysisDialog
                  onAddItems={handlePhotoAnalysisItems}
                  currentTrade={selectedTrade}
                />

                <ComparativeQuotesDialog
                  items={items.filter(item => item.description.trim())}
                  onSelectVariant={handleSelectVariant}
                  currentTrade={selectedTrade}
                />

                {history.length > 0 && (
                  <AIHistoryDropdown
                    history={history}
                    onRestore={handleRestoreFromHistory}
                    onRemove={removeFromHistory}
                    onClear={clearHistory}
                  />
                )}
              </div>

              {aiDescription.trim().length > 0 && aiDescription.trim().length < 20 && (
                <p className="text-xs text-muted-foreground text-center">
                  Encore {20 - aiDescription.trim().length} caractères minimum
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{formatCurrency(totalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatCurrency(totalVAT)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC</span>
                <span>{formatCurrency(totalTTC)}</span>
              </div>
              {parseFloat(depositPercent) > 0 && (
                <div className="flex justify-between text-primary font-medium pt-2">
                  <span>Acompte à verser ({depositPercent}%)</span>
                  <span>{formatCurrency(depositAmount)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 pb-24">
          <Button variant="outline" className="w-full sm:flex-1 h-12 text-base" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button className="w-full sm:flex-1 h-12 text-base" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer le devis'
            )}
          </Button>
        </div>
      </div>
    </LayoutContainer>
  )
}
