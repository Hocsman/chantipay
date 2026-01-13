'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, ArrowLeft, Trash2, Save, FileText, Euro, Calendar, Send, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { downloadInvoicePDF } from '@/lib/pdf/InvoicePdf'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string | null
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  client_siret?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
  payment_method?: string
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
  partial: { label: 'Paiement partiel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Euro },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Calendar },
  canceled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

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
        router.push('/dashboard/invoices')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!invoice) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      const data = await response.json()
      setInvoice(data.invoice)
      toast.success('✅ Facture mise à jour')
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSaving(false)
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
      router.push('/dashboard/invoices')
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

  const sendEmail = async () => {
    if (!invoice || !invoice.client_email) {
      toast.error('Aucun email client configuré')
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      await loadInvoice(id)
      toast.success(`✅ ${data.message}`)
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Facture" description="Chargement..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!invoice) {
    return null
  }

  const StatusIcon = paymentStatusConfig[invoice.payment_status].icon

  return (
    <LayoutContainer>
      <PageHeader title="Facture" description={invoice.invoice_number} />

      <div className="max-w-4xl space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Statut et actions rapides */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <StatusIcon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <span className={cn(
                    'inline-block text-xs font-medium px-2 py-1 rounded-full',
                    paymentStatusConfig[invoice.payment_status].color
                  )}>
                    {paymentStatusConfig[invoice.payment_status].label}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {invoice.payment_status === 'draft' && (
                  <Button size="sm" variant="outline" onClick={markAsSent}>
                    <Send className="mr-2 h-4 w-4" />
                    Marquer envoyée
                  </Button>
                )}
                {(invoice.payment_status === 'sent' || invoice.payment_status === 'overdue') && (
                  <Button size="sm" onClick={markAsPaid}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marquer payée
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)}>
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={sendEmail}
                disabled={isSendingEmail || !invoice.client_email}
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer par email
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await downloadInvoicePDF(
                      {
                        ...invoice,
                        items: invoice.items?.map((item) => ({
                          description: item.description,
                          quantity: item.quantity,
                          unit_price: item.unit_price,
                          total: item.total,
                        })) || [],
                      },
                      {
                        name: 'ChantiPay',
                        address: '123 Avenue Exemple, 75001 Paris',
                        phone: '+33 1 23 45 67 89',
                        email: 'contact@chantipay.fr',
                        siret: '123 456 789 00012',
                      }
                    )
                    toast.success('PDF téléchargé')
                  } catch (error) {
                    console.error(error)
                    toast.error('Erreur lors du téléchargement')
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          )}
        </div>

        {/* Facture professionnelle - Design amélioré */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* En-tête de facture avec branding */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-8 w-8" />
                    <h1 className="text-3xl font-bold">ChantiPay</h1>
                  </div>
                  <p className="text-blue-100 text-sm">Gestion de devis et factures pour artisans</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-100 mb-1">FACTURE</div>
                  <div className="text-2xl font-bold">{invoice.invoice_number}</div>
                </div>
              </div>
            </div>

            {/* Informations société et client */}
            <div className="grid md:grid-cols-2 gap-8 px-8 py-6 bg-gray-50 dark:bg-gray-900/20">
              <div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Facturé par
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                  <p className="font-bold text-lg mb-1">Votre Entreprise</p>
                  <p className="text-sm text-muted-foreground">Adresse de votre société</p>
                  <p className="text-sm text-muted-foreground">Code postal Ville</p>
                  <p className="text-sm text-muted-foreground mt-2">SIRET : XXX XXX XXX XXXXX</p>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Facturé à
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                  <p className="font-bold text-lg mb-1">{invoice.client_name}</p>
                  {invoice.client_address && (
                    <p className="text-sm text-muted-foreground">{invoice.client_address}</p>
                  )}
                  {invoice.client_email && (
                    <p className="text-sm text-muted-foreground mt-2">✉ {invoice.client_email}</p>
                  )}
                  {invoice.client_phone && (
                    <p className="text-sm text-muted-foreground">📞 {invoice.client_phone}</p>
                  )}
                  {invoice.client_siret && (
                    <p className="text-sm text-muted-foreground mt-2">SIRET : {invoice.client_siret}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informations de dates */}
            <div className="px-8 py-4 bg-blue-50 dark:bg-blue-950/20 grid grid-cols-2 md:grid-cols-4 gap-4 border-y">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date d'émission</div>
                <div className="font-semibold">
                  {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              {invoice.due_date && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date d'échéance</div>
                  <div className="font-semibold text-orange-600">
                    {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payée le</div>
                  <div className="font-semibold text-green-600">
                    {new Date(invoice.paid_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
              {invoice.payment_terms && (
                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Conditions</div>
                  <div className="font-medium text-sm">{invoice.payment_terms}</div>
                </div>
              )}
            </div>

            {/* Tableau des prestations */}
            <div className="px-8 py-6">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Détail des prestations
              </div>

              {invoice.items && invoice.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold">Description</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-24">Qté</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-32">Prix unit. HT</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-32">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.unit_price.toFixed(2)} €</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{item.total.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totaux */}
              <div className="mt-6 flex justify-end">
                <div className="w-full md:w-80 space-y-2">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">Sous-total HT</span>
                    <span className="font-medium">{invoice.subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-foreground">TVA ({invoice.tax_rate}%)</span>
                    <span className="font-medium">{invoice.tax_amount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-300 dark:border-gray-700">
                    <span>Total TTC</span>
                    <span className="text-blue-600">{invoice.total.toFixed(2)} €</span>
                  </div>

                  {invoice.payment_status === 'partial' && invoice.paid_amount && (
                    <>
                      <div className="flex justify-between py-2 text-sm text-green-600 font-medium border-t">
                        <span>Montant payé</span>
                        <span>-{invoice.paid_amount.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between py-2 text-lg font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 rounded">
                        <span>Reste à payer</span>
                        <span>{(invoice.total - invoice.paid_amount).toFixed(2)} €</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardContent className="p-6">
              <Label>Notes</Label>
              <p className="text-base text-muted-foreground mt-2">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
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
    </LayoutContainer>
  )
}
