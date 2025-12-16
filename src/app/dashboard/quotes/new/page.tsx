'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react'

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
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', description: '', quantity: 1, unit_price_ht: 0, vat_rate: 20 },
  ])

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
    if (!aiDescription.trim()) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          trade: 'general', // TODO: permettre de sélectionner le métier
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la génération')

      const data = await response.json()
      
      if (data.items && Array.isArray(data.items)) {
        const newItems: QuoteItem[] = data.items.map((item: Omit<QuoteItem, 'id'>, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          description: item.description,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          vat_rate: item.vat_rate || parseFloat(vatRate),
        }))

        // Remplacer les lignes vides ou ajouter les nouvelles
        if (items.length === 1 && !items[0].description) {
          setItems(newItems)
        } else {
          setItems([...items, ...newItems])
        }
      }
    } catch (error) {
      console.error('Erreur génération IA:', error)
      // TODO: afficher une notification d'erreur
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!selectedClientId) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (items.some((item) => !item.description)) {
      alert('Veuillez remplir toutes les descriptions')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          vat_rate: parseFloat(vatRate),
          deposit_percent: parseFloat(depositPercent),
          items,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du devis')
      }

      // Rediriger vers le devis créé
      router.push(`/dashboard/quotes/${data.quote.id}`)
    } catch (error) {
      console.error('Erreur création devis:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la création du devis')
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

            <Button variant="outline" className="mt-4" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
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
            <div className="space-y-3">
              <Textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Ex: Installation d'un ballon d'eau chaude de 200L en remplacement d'un ancien cumulus, avec dépose de l'ancien équipement et mise aux normes des raccordements..."
                rows={4}
              />
              <Button
                onClick={generateWithAI}
                disabled={!aiDescription.trim() || isGeneratingAI}
                className="w-full h-12 text-base"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le devis avec l&apos;IA
                  </>
                )}
              </Button>
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
