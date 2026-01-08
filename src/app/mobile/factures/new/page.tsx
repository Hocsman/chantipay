'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
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
import { Loader2, Plus, Trash2 } from 'lucide-react'
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

export default function NewInvoiceMobilePage() {
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
          items: items.filter(item => item.description.trim()),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la création')
        return
      }

      const data = await response.json()
      toast.success('✅ Facture créée')
      router.push(`/mobile/factures/${data.invoice.id}`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileAppShell title="Nouvelle facture">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Sélectionner" />
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
              <div className="p-2 bg-muted rounded text-xs space-y-0.5">
                {selectedClient.email && <p>📧 {selectedClient.email}</p>}
                {selectedClient.phone && <p>📞 {selectedClient.phone}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="issue_date">
                Émission <span className="text-red-500">*</span>
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
              <Label htmlFor="due_date">Échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lignes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <Label className="text-sm">Ligne {index + 1}</Label>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Prix HT</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="text-sm text-right font-medium">
                  Total: {item.total.toFixed(2)} €
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>

            {/* Totaux */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT:</span>
                <span className="font-medium">{calculateSubtotal().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span>TVA:</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-16 h-7 text-xs"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-xs">%</span>
                  <span className="font-medium ml-1">{calculateTaxAmount().toFixed(2)} €</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total TTC:</span>
                <span>{calculateTotal().toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes internes..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Boutons */}
        <div className="sticky bottom-0 bg-background p-4 -mx-4 border-t space-y-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer la facture'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">
            Annuler
          </Button>
        </div>
      </form>
    </MobileAppShell>
  )
}
