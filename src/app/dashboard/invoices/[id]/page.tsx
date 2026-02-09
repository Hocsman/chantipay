'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  CreditCard,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  AlertCircle,
  Wallet,
  CalendarCheck,
  FileText,
  Send,
  RefreshCw,
  FileCode,
  Euro,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { downloadInvoicePDF } from '@/lib/pdf/InvoicePdf'

type PaymentStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  vat_rate?: number
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
  siret: string | null
}

interface UserProfile {
  company_name: string | null
  full_name: string | null
  address: string | null
  phone: string | null
  email: string
  siret: string | null
  logo_url?: string | null
}

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
  payment_status: PaymentStatus
  payment_method?: string
  paid_amount?: number
  paid_at?: string
  due_date?: string
  issue_date: string
  sent_at?: string
  notes?: string
  payment_terms?: string
  items?: InvoiceItem[]
  clients?: Client
}

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  cash: 'Espèces',
  cheque: 'Chèque',
  carte: 'Carte bancaire',
  autre: 'Autre',
}

const paymentStatusConfig = {
  draft: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: FileText
  },
  sent: {
    label: 'Envoyée',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Send
  },
  paid: {
    label: 'Payée',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2
  },
  partial: {
    label: 'Paiement partiel',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Euro
  },
  overdue: {
    label: 'En retard',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: Calendar
  },
  canceled: {
    label: 'Annulée',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    icon: FileText
  },
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  // États data
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // États UI
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)

  // Charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, full_name, address, phone, email, siret')
        .eq('id', user.id)
        .single()

      if (profile) {
        const { data: logoData } = await supabase.storage
          .from('logos')
          .list(user.id, { limit: 1 })

        const logoUrl = logoData && logoData.length > 0
          ? supabase.storage.from('logos').getPublicUrl(`${user.id}/${logoData[0].name}`).data.publicUrl
          : null

        setUserProfile({ ...profile, logo_url: logoUrl })
      }
    }
  }, [])

  // Charger la facture
  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return

    // Valider le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(invoiceId)) {
      console.error('ID invalide (format UUID attendu):', invoiceId)
      setError('Identifiant de la facture invalide')
      setIsLoading(false)
      toast.error('Facture non trouvée', {
        description: 'L\'identifiant de la facture est invalide.'
      })
      setTimeout(() => router.push('/dashboard/invoices'), 2000)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) {
        throw new Error('Facture non trouvée')
      }

      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      console.error('Erreur chargement facture:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [invoiceId, router])

  useEffect(() => {
    loadInvoice()
    loadUserProfile()
  }, [loadInvoice, loadUserProfile])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Marquer comme payée
  const handleMarkPaid = async () => {
    if (!invoice || !paymentMethod) return

    setIsMarkingPaid(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'paid',
          paid_amount: invoice.total,
          payment_method: paymentMethod,
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')

      setIsPaymentDialogOpen(false)
      setPaymentMethod('')
      await loadInvoice()
      toast.success('Facture marquée comme payée')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsMarkingPaid(false)
    }
  }

  // Marquer comme envoyée
  const handleMarkSent = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) throw new Error('Erreur')

      await loadInvoice()
      toast.success('Facture marquée comme envoyée')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Téléchargement du PDF
  const handleDownloadPDF = async () => {
    if (!invoice) return

    setIsDownloadingPDF(true)
    try {
      await downloadInvoicePDF(
        {
          ...invoice,
          items: invoice.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            vat_rate: item.vat_rate,
          })) || [],
        },
        {
          name: userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise',
          address: userProfile?.address || '',
          phone: userProfile?.phone || '',
          email: userProfile?.email || '',
          siret: userProfile?.siret || '',
          logo: userProfile?.logo_url || undefined,
        }
      )
      toast.success('PDF téléchargé', {
        description: `La facture ${invoice.invoice_number} a été téléchargée`
      })
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error)
      toast.error('Erreur', {
        description: 'Impossible de télécharger le PDF'
      })
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  // Téléchargement Factur-X
  const handleDownloadFacturX = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/facturx-pdf`)
      if (!response.ok) {
        throw new Error('Erreur lors de la génération')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `facture-${invoice.invoice_number}-facturx.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('PDF Factur-X téléchargé', {
        description: 'PDF/A-3 conforme EN 16931 avec XML embarqué'
      })
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du téléchargement Factur-X')
    }
  }

  // Envoyer par email
  const handleSendEmail = async () => {
    if (!invoice) return
    if (!invoice.client_email) {
      toast.error('Le client n\'a pas d\'adresse email')
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'RESEND_NOT_CONFIGURED') {
          toast.error('Service d\'email non configuré', {
            description: 'Contactez votre administrateur pour activer l\'envoi d\'emails.',
            duration: 6000
          })
        } else {
          toast.error(data.error || 'Erreur lors de l\'envoi')
        }
        return
      }

      await loadInvoice()
      toast.success('Email envoyé avec succès', {
        description: `Facture envoyée à ${invoice.client_email}`,
      })
    } catch (error) {
      console.error('Erreur envoi email:', error)
      toast.error('Erreur lors de l\'envoi de l\'email')
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Envoyer une relance
  const handleSendReminder = async () => {
    if (!invoice) return
    if (!invoice.client_email) {
      toast.error('Le client n\'a pas d\'adresse email')
      return
    }
    if (!['sent', 'overdue', 'partial'].includes(invoice.payment_status)) {
      toast.error('Cette facture n\'est pas éligible à une relance')
      return
    }

    setIsSendingReminder(true)
    try {
      const response = await fetch('/api/invoices/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: [invoice.id] }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'envoi')

      toast.success('Relance envoyée', {
        description: `Email de relance envoyé à ${invoice.client_email}`,
      })
    } catch (error) {
      console.error('Erreur envoi relance:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la relance')
    } finally {
      setIsSendingReminder(false)
    }
  }

  // État de chargement
  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement de la facture...</p>
          </div>
        </div>
      </LayoutContainer>
    )
  }

  // État d'erreur
  if (error || !invoice) {
    return (
      <LayoutContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader title="Facture" description="" />
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Facture non trouvée</h3>
                <p className="text-muted-foreground">{error || 'Cette facture n\'existe pas ou vous n\'y avez pas accès.'}</p>
              </div>
              <Button onClick={() => router.push('/dashboard/invoices')}>
                Retour à la liste des factures
              </Button>
            </div>
          </CardContent>
        </Card>
      </LayoutContainer>
    )
  }

  const currentStatus = paymentStatusConfig[invoice.payment_status]
  const StatusIcon = currentStatus.icon
  const isPaid = invoice.payment_status === 'paid'
  const canMarkAsPaid = ['sent', 'overdue', 'partial'].includes(invoice.payment_status)
  const canSendReminder = ['sent', 'overdue', 'partial'].includes(invoice.payment_status) && invoice.client_email
  const remainingAmount = invoice.total - (invoice.paid_amount || 0)

  return (
    <LayoutContainer>
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={invoice.invoice_number}
            description={`Émise le ${formatDate(invoice.issue_date)}`}
          />
        </div>
        <Badge className={cn('text-sm px-3 py-1', currentStatus.color)}>
          <StatusIcon className="h-4 w-4 mr-1.5" />
          {currentStatus.label}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-lg">{invoice.client_name}</p>
              {invoice.client_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{invoice.client_phone}</span>
                </div>
              )}
              {invoice.client_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{invoice.client_email}</span>
                </div>
              )}
              {invoice.client_address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{invoice.client_address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lignes de la facture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détail de la facture</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vue mobile */}
            <div className="space-y-3 md:hidden">
              {invoice.items?.map((item, index) => (
                <div key={item.id || index} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{item.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  {item.vat_rate !== undefined && (
                    <span className="text-xs text-muted-foreground">TVA {item.vat_rate}%</span>
                  )}
                </div>
              ))}
            </div>

            {/* Vue desktop */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        (item.vat_rate ?? invoice.tax_rate) === 20 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        (item.vat_rate ?? invoice.tax_rate) === 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        (item.vat_rate ?? invoice.tax_rate) === 5.5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      )}>
                        {item.vat_rate ?? invoice.tax_rate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totaux */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total TTC</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.payment_status === 'partial' && invoice.paid_amount && (
                <>
                  <div className="flex justify-between text-sm text-green-600 border-t pt-2">
                    <span>Montant payé</span>
                    <span>-{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-orange-600">
                    <span>Reste à payer</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Échéance */}
        {invoice.due_date && (
          <Card className={cn(
            'border-2',
            isPaid ? 'border-green-500' :
            invoice.payment_status === 'overdue' ? 'border-red-500' : 'border-orange-300'
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Échéance
                </CardTitle>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    <Check className="h-4 w-4" />
                    Réglée
                  </span>
                ) : invoice.payment_status === 'overdue' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    En retard
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                    À payer
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDate(invoice.due_date)}
              </p>
              {invoice.payment_terms && (
                <p className="text-sm text-muted-foreground mt-1">
                  {invoice.payment_terms}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section Paiement */}
        <Card className={cn(
          'border-2',
          isPaid ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-primary'
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Paiement
            </CardTitle>
            <CardDescription>
              {isPaid
                ? 'Cette facture a été réglée'
                : 'Marquez cette facture comme payée'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <div className="flex items-center gap-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300 text-lg">Facture payée</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-green-700 dark:text-green-400">
                    {invoice.payment_method && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {PAYMENT_METHOD_LABELS[invoice.payment_method] || invoice.payment_method}
                      </span>
                    )}
                    {invoice.paid_at && (
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        {formatDate(invoice.paid_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : canMarkAsPaid ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Montant à encaisser : <strong>{formatCurrency(remainingAmount)}</strong>
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-semibold"
                  size="lg"
                  onClick={() => setIsPaymentDialogOpen(true)}
                >
                  <Wallet className="h-5 w-5 mr-3" />
                  Marquer comme payée
                </Button>
              </div>
            ) : invoice.payment_status === 'draft' ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Cette facture est en brouillon. Envoyez-la d'abord au client.
                  </p>
                </div>
                <Button
                  className="w-full h-12"
                  variant="outline"
                  onClick={handleMarkSent}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Marquer comme envoyée
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-24">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSendEmail}
            disabled={isSendingEmail || !invoice.client_email}
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </>
            )}
          </Button>
          {canSendReminder && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSendReminder}
              disabled={isSendingReminder}
            >
              {isSendingReminder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Relancer
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
          >
            {isDownloadingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadFacturX}
          >
            <FileCode className="h-4 w-4 mr-2" />
            Factur-X
          </Button>
        </div>
      </div>

      {/* Dialog pour marquer comme payée */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Marquer comme payée</DialogTitle>
            <DialogDescription className="text-base">
              Montant : <strong>{formatCurrency(remainingAmount)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="w-full h-12">
                  <SelectValue placeholder="Sélectionnez une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false)
                setPaymentMethod('')
              }}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={!paymentMethod || isMarkingPaid}
              className="w-full sm:w-auto"
            >
              {isMarkingPaid ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmer le paiement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
