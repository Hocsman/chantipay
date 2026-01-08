'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Trash2, FileText, Euro, Calendar, Send, CheckCircle2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string | null
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
  paid_amount?: number
  paid_at?: string
  due_date?: string
  issue_date: string
  sent_at?: string
  notes?: string
  payment_terms?: string
  items?: InvoiceItem[]
}

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

const paymentStatusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Euro },
  overdue: { label: 'Retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Calendar },
  canceled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
}

export default function InvoiceDetailMobilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadInvoice(p.id)
    })
  }, [])

  const loadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      } else {
        toast.error('Facture non trouvée')
        router.push('/mobile/factures')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('✅ Facture supprimée')
      router.push('/mobile/factures')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const markAsPaid = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          paid_amount: invoice.total,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      setInvoice(data.invoice)
      toast.success('✅ Facture marquée comme payée')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const markAsSent = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      setInvoice(data.invoice)
      toast.success('✅ Facture marquée comme envoyée')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (isLoading) {
    return (
      <MobileAppShell title="Facture">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    )
  }

  if (!invoice) {
    return null
  }

  const StatusIcon = paymentStatusConfig[invoice.payment_status].icon

  return (
    <MobileAppShell title={invoice.invoice_number}>
      <div className="p-4 space-y-4">
        {/* Statut et actions rapides */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-sm">{invoice.client_name}</p>
                <span className={cn(
                  'inline-block text-xs font-medium px-2 py-1 rounded-full',
                  paymentStatusConfig[invoice.payment_status].color
                )}>
                  {paymentStatusConfig[invoice.payment_status].label}
                </span>
              </div>
            </div>
            
            {invoice.payment_status === 'draft' && (
              <Button size="sm" variant="outline" onClick={markAsSent} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Marquer envoyée
              </Button>
            )}
            
            {(invoice.payment_status === 'sent' || invoice.payment_status === 'overdue') && (
              <Button size="sm" onClick={markAsPaid} className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marquer payée
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Informations client */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-2">Client</h3>
            <p className="text-sm"><strong>{invoice.client_name}</strong></p>
            {invoice.client_email && <p className="text-sm">📧 {invoice.client_email}</p>}
            {invoice.client_phone && <p className="text-sm">📞 {invoice.client_phone}</p>}
            {invoice.client_address && <p className="text-sm text-muted-foreground">📍 {invoice.client_address}</p>}
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm mb-2">Dates</h3>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Émission:</span>
              <span className="font-medium">
                {new Date(invoice.issue_date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            {invoice.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Échéance:</span>
                <span className="font-medium">
                  {new Date(invoice.due_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                  })}
                </span>
              </div>
            )}
            {invoice.paid_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Payée le:</span>
                <span className="font-medium text-green-600">
                  {new Date(invoice.paid_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm mb-2">Détails</h3>
            
            {invoice.items && invoice.items.length > 0 && (
              <div className="space-y-2">
                {invoice.items.map((item, index) => (
                  <div key={index} className="border rounded p-2">
                    <p className="font-medium text-sm mb-1">{item.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{item.quantity} × {item.unit_price.toFixed(2)} €</span>
                      <span className="font-medium text-foreground">{item.total.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total HT:</span>
                <span className="font-medium">{invoice.subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({invoice.tax_rate}%):</span>
                <span className="font-medium">{invoice.tax_amount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC:</span>
                <span>{invoice.total.toFixed(2)} €</span>
              </div>
              
              {invoice.payment_status === 'partial' && invoice.paid_amount && (
                <>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Payé:</span>
                    <span>{invoice.paid_amount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600 font-medium">
                    <span>Reste:</span>
                    <span>{(invoice.total - invoice.paid_amount).toFixed(2)} €</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Bouton supprimer */}
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer la facture
        </Button>
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la facture ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La facture {invoice.invoice_number} sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileAppShell>
  )
}
