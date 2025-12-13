'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
} from '@/components/ui/dialog'
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
} from 'lucide-react'

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

// Données de démonstration
const mockQuote = {
  id: '1',
  quote_number: 'DEV-2024-001',
  status: 'draft' as QuoteStatus,  // Brouillon pour montrer le bouton de signature
  created_at: '2024-01-15',
  expires_at: '2024-02-15',
  signed_at: null as string | null,  // Pas encore signé
  signature_image_url: null,
  vat_rate: 10,
  deposit_amount: 375,
  deposit_status: 'pending' as 'pending' | 'paid',
  payment_link_url: null,
  client: {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78',
    address_line1: '15 Rue de la République',
    postal_code: '75001',
    city: 'Paris',
  },
  items: [
    { id: '1', description: 'Fourniture ballon d\'eau chaude 200L', quantity: 1, unit_price_ht: 650, vat_rate: 10 },
    { id: '2', description: 'Main d\'œuvre : dépose ancien cumulus', quantity: 1, unit_price_ht: 120, vat_rate: 10 },
    { id: '3', description: 'Main d\'œuvre : pose et raccordement', quantity: 1, unit_price_ht: 280, vat_rate: 10 },
    { id: '4', description: 'Mise aux normes raccordements électriques', quantity: 1, unit_price_ht: 85, vat_rate: 10 },
  ],
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const quoteId = params.id as string

  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)
  const [isSavingSignature, setIsSavingSignature] = useState(false)

  // Calculs des totaux
  const totalHT = mockQuote.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_ht,
    0
  )
  const totalVAT = mockQuote.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_ht * (item.vat_rate / 100),
    0
  )
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

  // État local pour simuler le changement après signature
  const [isSigned, setIsSigned] = useState(false)

  // Gestion de la signature
  const handleSignature = async (signatureDataUrl: string) => {
    setIsSavingSignature(true)
    try {
      const response = await fetch(`/api/quotes/${mockQuote.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureDataUrl }),
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde')

      // Fermer le dialog et marquer comme signé
      setIsSignatureDialogOpen(false)
      setIsSigned(true)
      
      // Afficher une alerte de succès
      alert('✅ ' + data.message)
    } catch (error) {
      console.error('Erreur signature:', error)
      alert('❌ Erreur lors de la signature. Veuillez réessayer.')
    } finally {
      setIsSavingSignature(false)
    }
  }

  // Création du lien de paiement
  const handleCreatePaymentLink = async () => {
    setIsCreatingPaymentLink(true)
    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: mockQuote.id }),
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
    setIsDownloadingPDF(true)
    try {
      const response = await fetch(`/api/quotes/${mockQuote.id}/pdf`)
      
      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${mockQuote.quote_number}.pdf`
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

  return (
    <LayoutContainer>
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <PageHeader
            title={mockQuote.quote_number}
            description={`Créé le ${formatDate(mockQuote.created_at)}`}
          />
        </div>
        <QuoteStatusBadge status={mockQuote.status} />
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
              <p className="font-medium text-lg">{mockQuote.client.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{mockQuote.client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{mockQuote.client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {mockQuote.client.address_line1}, {mockQuote.client.postal_code} {mockQuote.client.city}
                </span>
              </div>
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
              {mockQuote.items.map((item) => (
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
                {mockQuote.items.map((item) => (
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Acompte
            </CardTitle>
            <CardDescription>
              {mockQuote.deposit_status === 'paid' ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Acompte reçu
                </span>
              ) : (
                'En attente de paiement'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(mockQuote.deposit_amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((mockQuote.deposit_amount / totalTTC) * 100)}% du total
                </p>
              </div>
              {mockQuote.status === 'signed' && mockQuote.deposit_status === 'pending' && (
                <Button onClick={handleCreatePaymentLink} disabled={isCreatingPaymentLink}>
                  {isCreatingPaymentLink ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Créer le lien
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        {mockQuote.signed_at || isSigned ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-700">
                <Check className="h-6 w-6" />
                <div>
                  <p className="font-medium">Devis signé</p>
                  <p className="text-sm">
                    {mockQuote.signed_at 
                      ? `Le ${formatDate(mockQuote.signed_at)}`
                      : `Le ${formatDate(new Date().toISOString())}`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          (mockQuote.status === 'draft' || mockQuote.status === 'sent') ? (
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsSignatureDialogOpen(true)}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Signer le devis
                </Button>
              </CardContent>
            </Card>
          ) : null
        )}

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

      {/* Dialog de signature */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Signature du devis</DialogTitle>
            <DialogDescription>
              Demandez à votre client de signer ci-dessous
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handleSignature}
            onCancel={() => setIsSignatureDialogOpen(false)}
            isLoading={isSavingSignature}
          />
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
