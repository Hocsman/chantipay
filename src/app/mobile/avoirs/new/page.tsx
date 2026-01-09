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

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  total: number
}

interface CreditNoteItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function NewCreditNoteMobilePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [items, setItems] = useState<CreditNoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 },
  ])
  const [formData, setFormData] = useState({
    client_id: '',
    invoice_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    tax_rate: 20.0,
    reason: '',
    notes: '',
  })

  useEffect(() => {
    loadClients()
    loadInvoices()
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

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices.filter((inv: Invoice) => inv.total > 0))
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

  const updateItem = (index: number, field: keyof CreditNoteItem, value: any) => {
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
      toast.error('Ajoutez au moins une ligne à l\'avoir')
      return
    }

    if (!formData.reason.trim()) {
      toast.error('Veuillez indiquer la raison de l\'avoir')
      return
    }

    setIsSubmitting(true)

    try {
      const subtotal = calculateSubtotal()
      const taxAmount = calculateTaxAmount()
      const total = calculateTotal()

      const response = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          invoice_id: formData.invoice_id || null,
          client_name: selectedClient.name,
          client_email: selectedClient.email || null,
          client_phone: selectedClient.phone || null,
          client_address: selectedClient.address || null,
          client_siret: selectedClient.siret || null,
          issue_date: formData.issue_date,
          tax_rate: formData.tax_rate,
          subtotal,
          tax_amount: taxAmount,
          total,
          status: 'draft',
          reason: formData.reason,
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
      toast.success('✅ Avoir créé')
      router.push(`/mobile/avoirs`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileAppShell title="Nouvel avoir">
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

            <div className="space-y-2">
              <Label htmlFor="invoice">Facture (optionnel)</Label>
              <Select value={formData.invoice_id || undefined} onValueChange={(value) => setFormData({ ...formData, invoice_id: value })}>
                <SelectTrigger id="invoice">
                  <SelectValue placeholder="Sélectionner une facture (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} ({invoice.total.toFixed(2)} €)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="issue_date">
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
              <Label htmlFor="reason">
                Raison <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ex: Annulation, défaut produit..."
                rows={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Lignes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lignes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Ligne {index + 1}</span>
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

                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Prix HT</Label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>

            {/* Totaux */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT :</span>
                <span className="font-medium text-red-600">-{calculateSubtotal().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span>TVA :</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-14 h-7 text-xs"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-xs">%</span>
                  <span className="font-medium text-red-600 ml-1">-{calculateTaxAmount().toFixed(2)} €</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total TTC :</span>
                <span className="text-red-600">-{calculateTotal().toFixed(2)} €</span>
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

        {/* Actions */}
        <div className="sticky bottom-0 bg-background p-4 border-t -mx-4 flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              'Créer'
            )}
          </Button>
        </div>
      </form>
    </MobileAppShell>
  )
}
