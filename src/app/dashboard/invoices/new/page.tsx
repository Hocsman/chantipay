'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ArrowLeft, Plus, Trash2, Calendar, MapPin } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  siret?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ])
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Paiement à 30 jours',
    tax_rate: 20.0,
    notes: '',
    work_location: '',
    is_subcontracting: false,
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setSelectedClient(client || null)
    setFormData({ ...formData, client_id: clientId })
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Calculer le total de la ligne
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * formData.tax_rate) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      toast.error('Veuillez sélectionner un client')
      return
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      toast.error('Ajoutez au moins une ligne à la facture')
      return
    }

    setIsSubmitting(true)

    try {
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTaxAmount()
      const total = calculateTotal()

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          client_name: selectedClient.name,
          client_email: selectedClient.email || null,
          client_phone: selectedClient.phone || null,
          client_address: selectedClient.address || null,
          client_siret: selectedClient.siret || null,
          issue_date: formData.issue_date,
          due_date: formData.due_date || null,
          payment_terms: formData.payment_terms || null,
          tax_rate: formData.tax_rate,
          subtotal,
          tax_amount: taxAmount,
          total,
          payment_status: 'draft',
          notes: formData.notes || null,
          work_location: formData.work_location.trim() || null,
          is_subcontracting: formData.is_subcontracting,
          items: items.filter(item => item.description.trim()),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      const data = await response.json()
      toast.success('✅ Facture créée avec succès')
      router.push(`/dashboard/invoices/${data.invoice.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <LayoutContainer>
      <PageHeader title="Nouvelle facture" description="Créer une nouvelle facture" />

      <div className="max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.client_id} onValueChange={handleClientChange}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <p><strong>Email :</strong> {selectedClient.email || 'Non renseigné'}</p>
                  <p><strong>Téléphone :</strong> {selectedClient.phone || 'Non renseigné'}</p>
                  {selectedClient.address && <p><strong>Adresse :</strong> {selectedClient.address}</p>}
                  {selectedClient.siret && <p><strong>SIRET :</strong> {selectedClient.siret}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates et paiement</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issue_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'émission <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'échéance
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payment_terms">Conditions de paiement</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="Ex: Paiement à 30 jours"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lieu d'intervention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Lieu d&apos;intervention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="work_location">
                  Adresse du chantier (si différente de l&apos;adresse du client)
                </Label>
                <Textarea
                  id="work_location"
                  value={formData.work_location}
                  onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  placeholder="Ex: 15 rue de la Paix, 75002 Paris"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_subcontracting" className="font-medium">
                    Facture en sous-traitance
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Active l&apos;autoliquidation de la TVA (Article 283-2 nonies du CGI)
                  </p>
                </div>
                <Switch
                  id="is_subcontracting"
                  checked={formData.is_subcontracting}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_subcontracting: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lignes de facture */}
          <Card>
            <CardHeader>
              <CardTitle>Détail de la facture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid gap-2 md:grid-cols-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description de la prestation"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prix unitaire HT</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="pt-8">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une ligne
              </Button>

              {/* Totaux */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sous-total HT :</span>
                  <span className="font-medium">{calculateSubtotal().toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span>TVA :</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-20 h-8 text-sm"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-sm">%</span>
                    <span className="font-medium">{calculateTaxAmount().toFixed(2)} €</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC :</span>
                  <span>{calculateTotal().toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes internes ou mentions légales..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Boutons */}
          <div className="flex gap-3 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la facture'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </LayoutContainer>
  )
}
