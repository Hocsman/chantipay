'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge'
import { SignaturePad } from '@/components/SignaturePad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  ArrowLeft,
  Download,
  CreditCard,
  PenTool,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  AlertCircle,
  Wallet,
  CalendarCheck,
} from 'lucide-react'

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

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
  email: string
  phone: string
  address_line1: string | null
  address_line2: string | null
  postal_code: string | null
  city: string | null
}

interface Quote {
  id: string
  quote_number: string
  status: QuoteStatus
  created_at: string
  valid_until: string | null
  signed_at: string | null
  signature_image_url: string | null
  deposit_percent: number
  deposit_amount: number
  deposit_status: 'pending' | 'paid'
  deposit_paid_at: string | null
  deposit_method: 'virement' | 'cash' | 'cheque' | 'autre' | null
  payment_link_url: string | null
  items: QuoteItem[]
  clients: Client
}

// Deposit method labels
const DEPOSIT_METHOD_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  cash: 'Espèces',
  cheque: 'Chèque',
  autre: 'Autre',
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string

  // États data
  const [quote, setQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États UI
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [depositMethod, setDepositMethod] = useState<string>('')
  const [isMarkingDeposit, setIsMarkingDeposit] = useState(false)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isSavingSignature, setIsSavingSignature] = useState(false)
  const [isSigned, setIsSigned] = useState(false)

  // Charger le devis directement depuis Supabase (côté client)
  const loadQuote = useCallback(async () => {
    if (!quoteId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Récupérer le devis avec les infos client (utiliser * pour éviter les erreurs de colonnes manquantes)
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (*)
        `)
        .eq('id', quoteId)
        .single()
      
      if (quoteError) {
        console.error('Erreur Supabase:', quoteError)
        throw new Error(quoteError.message || 'Devis non trouvé')
      }
      
      // Récupérer les lignes du devis
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true })
      
      if (itemsError) {
        console.error('Erreur items:', itemsError)
      }
      
      const fullQuote = {
        ...quoteData,
        items: items || []
      }
      
      console.log('Quote loaded:', fullQuote)
      setQuote(fullQuote)
    } catch (err) {
      console.error('Erreur chargement devis:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  // Calculs des totaux
  const totalHT = quote?.items?.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_ht,
    0
  ) || 0
  const totalVAT = quote?.items?.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_ht * (item.vat_rate / 100),
    0
  ) || 0
  const totalTTC = totalHT + totalVAT

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Gestion de la signature
  const handleSignature = async (signatureDataUrl: string) => {
    if (!quote) return
    
    setIsSavingSignature(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureDataUrl }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde')

      // Fermer le dialog et marquer comme signé
      setIsSignatureDialogOpen(false)
      setIsSigned(true)
      
      // Recharger le devis pour avoir les données à jour
      await loadQuote()
      
      // Afficher une alerte de succès
      alert('✅ ' + data.message)
    } catch (error) {
      console.error('Erreur signature:', error)
      alert('❌ Erreur lors de la signature. Veuillez réessayer.')
    } finally {
      setIsSavingSignature(false)
    }
  }

  // Marquer l'acompte comme payé
  const handleMarkDepositPaid = async () => {
    if (!quote || !depositMethod) return
    
    setIsMarkingDeposit(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: depositMethod }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')

      // Fermer le dialog et recharger
      setIsDepositDialogOpen(false)
      setDepositMethod('')
      
      // Recharger le devis
      await loadQuote()
      
      // Afficher une alerte de succès
      alert('✅ Acompte marqué comme payé')
    } catch (error) {
      console.error('Erreur marquage acompte:', error)
      alert('❌ Erreur lors du marquage de l\'acompte')
    } finally {
      setIsMarkingDeposit(false)
    }
  }

  // Création du lien de paiement
  const handleCreatePaymentLink = async () => {
    if (!quote) return
    
    setIsCreatingPaymentLink(true)
    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id }),
      })

      if (!response.ok) throw new Error('Erreur lors de la création du lien')

      const data = await response.json()
      
      // Ouvrir le lien dans un nouvel onglet
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank')
      }
    } catch (error) {
      console.error('Erreur création lien paiement:', error)
    } finally {
      setIsCreatingPaymentLink(false)
    }
  }

  // Téléchargement du PDF
  const handleDownloadPDF = async () => {
    if (!quote) return
    
    setIsDownloadingPDF(true)
    try {
      const response = await fetch(`/api/quotes/${quote.id}/pdf`)
      
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.quote_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error)
    } finally {
      setIsDownloadingPDF(false)
    }
  }

  // État de chargement
  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement du devis...</p>
          </div>
        </div>
      </LayoutContainer>
    )
  }

  // État d'erreur
  if (error || !quote) {
    return (
      <LayoutContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader title="Devis" description="" />
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold text-lg">Devis non trouvé</h3>
                <p className="text-muted-foreground">{error || 'Ce devis n\'existe pas ou vous n\'y avez pas accès.'}</p>
              </div>
              <Button onClick={() => router.push('/dashboard/quotes')}>
                Retour à la liste des devis
              </Button>
            </div>
          </CardContent>
        </Card>
      </LayoutContainer>
    )
  }

  const client = quote.clients
  const isQuoteSigned = quote.signed_at || isSigned || quote.status === 'signed'

  return (
    <LayoutContainer>
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={quote.quote_number}
            description={`Créé le ${formatDate(quote.created_at)}`}
          />
        </div>
        <QuoteStatusBadge status={quote.status} />
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
              <p className="font-medium text-lg">{client.name}</p>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {(client.address_line1 || client.city) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {[client.address_line1, client.postal_code, client.city]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lignes du devis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détail du devis</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Vue mobile */}
            <div className="space-y-3 md:hidden">
              {quote.items.map((item) => (
                <div key={item.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{item.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{item.quantity} x {formatCurrency(item.unit_price_ht)}</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.quantity * item.unit_price_ht)}
                    </span>
                  </div>
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
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price_ht)}</TableCell>
                    <TableCell className="text-right">{item.vat_rate}%</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.quantity * item.unit_price_ht)}
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
                <span>{formatCurrency(totalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatCurrency(totalVAT)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2">
                <span>Total TTC</span>
                <span>{formatCurrency(totalTTC)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acompte */}
        <Card className={`border-2 ${quote.deposit_status === 'paid' ? 'border-green-500' : 'border-orange-300'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Acompte
              </CardTitle>
              {quote.deposit_status === 'paid' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <Check className="h-4 w-4" />
                  Encaissé
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                  En attente
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Montant de l'acompte */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(quote.deposit_amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quote.deposit_percent || Math.round((quote.deposit_amount / totalTTC) * 100)}% du total TTC
                  </p>
                </div>
              </div>
              
              {/* Si acompte payé: afficher les détails */}
              {quote.deposit_status === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">
                        Acompte encaissé
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-green-700">
                        {quote.deposit_method && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5" />
                            {DEPOSIT_METHOD_LABELS[quote.deposit_method] || quote.deposit_method}
                          </span>
                        )}
                        {quote.deposit_paid_at && (
                          <span className="flex items-center gap-1">
                            <CalendarCheck className="h-3.5 w-3.5" />
                            {formatDate(quote.deposit_paid_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Si acompte en attente: bouton pour marquer comme payé */}
              {quote.deposit_status === 'pending' && (
                <Button 
                  className="w-full h-12 text-base font-semibold" 
                  onClick={() => setIsDepositDialogOpen(true)}
                >
                  <Wallet className="h-5 w-5 mr-2" />
                  Marquer l'acompte comme payé
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Signature du devis */}
        <Card className={`border-2 ${isQuoteSigned ? 'border-green-500 bg-green-50' : 'border-primary'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Signature du devis
            </CardTitle>
            <CardDescription>
              {isQuoteSigned 
                ? 'Le client a accepté et signé ce devis'
                : 'Faites signer le client pour valider le devis'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isQuoteSigned ? (
              <div className="flex items-center gap-4 p-4 bg-green-100 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-800 text-lg">Devis signé ✓</p>
                  <p className="text-sm text-green-700">
                    {quote.signed_at 
                      ? `Signé le ${formatDate(quote.signed_at)}`
                      : `Signé le ${formatDate(new Date().toISOString())}`
                    }
                  </p>
                </div>
              </div>
            ) : (quote.status === 'draft' || quote.status === 'sent') ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📱 Passez le téléphone à votre client pour qu'il signe directement sur l'écran
                  </p>
                </div>
                <Button
                  className="w-full h-14 text-lg font-semibold"
                  size="lg"
                  onClick={() => setIsSignatureDialogOpen(true)}
                >
                  <PenTool className="h-5 w-5 mr-3" />
                  Signer sur ce téléphone
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-24">
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
        </div>
      </div>

      {/* Dialog de signature - plein écran sur mobile */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">✍️ Signature du client</DialogTitle>
            <DialogDescription className="text-base">
              <strong>{client.name}</strong>, veuillez signer ci-dessous pour accepter le devis <strong>{quote.quote_number}</strong> d'un montant de <strong>{formatCurrency(totalTTC)}</strong>
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handleSignature}
            onCancel={() => setIsSignatureDialogOpen(false)}
            isLoading={isSavingSignature}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog pour marquer l'acompte comme payé */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">💰 Marquer l'acompte comme payé</DialogTitle>
            <DialogDescription className="text-base">
              Montant : <strong>{formatCurrency(quote.deposit_amount)}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-method">Méthode de paiement</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger id="deposit-method" className="w-full h-12">
                  <SelectValue placeholder="Sélectionnez une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">
                    <span className="flex items-center gap-2">
                      🏦 Virement bancaire
                    </span>
                  </SelectItem>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2">
                      💵 Espèces
                    </span>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <span className="flex items-center gap-2">
                      📝 Chèque
                    </span>
                  </SelectItem>
                  <SelectItem value="autre">
                    <span className="flex items-center gap-2">
                      📋 Autre
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDepositDialogOpen(false)
                setDepositMethod('')
              }}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleMarkDepositPaid}
              disabled={!depositMethod || isMarkingDeposit}
              className="w-full sm:w-auto"
            >
              {isMarkingDeposit ? (
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
