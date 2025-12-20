'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Download,
  FileText,
  Pen,
  Wallet,
  Sparkles,
  Loader2,
  RotateCcw,
  Home,
  UserPlus,
} from 'lucide-react'
import { SignaturePad } from '@/components/SignaturePad'
import {
  demoProfile,
  demoClient,
  demoQuote,
  demoItems,
  formatCurrency,
  formatDate,
} from '@/lib/demo/demoData'

type DepositMethod = 'virement' | 'especes' | 'cheque' | 'autre'

const depositMethodLabels: Record<DepositMethod, string> = {
  virement: 'Virement bancaire',
  especes: 'Espèces',
  cheque: 'Chèque',
  autre: 'Autre',
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [pdfDownloaded, setPdfDownloaded] = useState(false)
  const [depositDialogOpen, setDepositDialogOpen] = useState(false)
  const [depositPaid, setDepositPaid] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null)
  const [showSignaturePad, setShowSignaturePad] = useState(false)

  // Handle signature save
  const handleSaveSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl)
    setShowSignaturePad(false)
    setCurrentStep(3)
  }

  // Handle PDF download
  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch('/api/demo/quote/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl }),
      })

      if (!response.ok) throw new Error('Erreur lors de la génération du PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'devis-demo-chantipay.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setPdfDownloaded(true)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement du PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  // Handle deposit confirmation
  const handleConfirmDeposit = () => {
    if (selectedMethod) {
      setDepositPaid(true)
      setDepositDialogOpen(false)
      setCurrentStep(4)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour</span>
          </Link>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Sparkles className="h-3 w-3 mr-1" />
            Démonstration
          </Badge>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Title section */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Démo ChantiPay</h1>
          <p className="text-muted-foreground text-sm">
            Testez le parcours complet en 1 minute (sans créer de compte)
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 w-12 rounded-full transition-colors ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Quote Preview */}
        <Card className={currentStep >= 1 ? '' : 'opacity-50'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep > 1 ? 'bg-green-100 text-green-700' : 'bg-primary text-white'
              }`}>
                {currentStep > 1 ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div>
                <CardTitle className="text-lg">Étape 1 — Aperçu du devis</CardTitle>
                <CardDescription>Vérifiez les détails du devis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company info */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-semibold">{demoProfile.company_name}</p>
              <p className="text-muted-foreground">
                {demoProfile.address}, {demoProfile.postal_code} {demoProfile.city}
              </p>
              <p className="text-muted-foreground">SIRET: {demoProfile.siret}</p>
            </div>

            {/* Client info */}
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground uppercase mb-1">Client</p>
              <p className="font-medium">{demoClient.name}</p>
              <p className="text-muted-foreground">
                {demoClient.address}, {demoClient.postal_code} {demoClient.city}
              </p>
            </div>

            {/* Quote info */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Devis n°</span>
                <span className="font-mono">{demoQuote.quote_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validité</span>
                <span>{formatDate(demoQuote.valid_until)}</span>
              </div>
            </div>

            {/* Quote title */}
            <div>
              <p className="font-semibold">{demoQuote.title}</p>
              <p className="text-sm text-muted-foreground">{demoQuote.description}</p>
            </div>

            {/* Items table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2 w-16">Qté</th>
                    <th className="text-right p-2 w-20">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {demoItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">{item.description}</td>
                      <td className="text-right p-2 text-muted-foreground">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="text-right p-2 font-medium">
                        {formatCurrency(item.total_ht)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total HT</span>
                <span>{formatCurrency(demoQuote.total_ht)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>TVA ({demoQuote.vat_rate}%)</span>
                <span>{formatCurrency(demoQuote.total_tva)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-1 border-t">
                <span>Total TTC</span>
                <span>{formatCurrency(demoQuote.total_ttc)}</span>
              </div>
            </div>

            {/* Deposit info */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">
                Acompte demandé ({demoQuote.deposit_percentage}%)
              </p>
              <p className="text-xl font-bold text-amber-900">
                {formatCurrency(demoQuote.deposit_amount)}
              </p>
            </div>

            {currentStep === 1 && (
              <Button className="w-full" size="lg" onClick={() => setCurrentStep(2)}>
                Passer à la signature
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Signature */}
        <Card className={currentStep >= 2 ? '' : 'opacity-50 pointer-events-none'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep > 2 ? 'bg-green-100 text-green-700' : currentStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > 2 ? <Check className="h-4 w-4" /> : <Pen className="h-4 w-4" />}
              </div>
              <div>
                <CardTitle className="text-lg">Étape 2 — Signature électronique</CardTitle>
                <CardDescription>Signez avec votre doigt ou souris</CardDescription>
              </div>
            </div>
          </CardHeader>
          {currentStep >= 2 && (
            <CardContent className="space-y-4">
              {!signatureDataUrl ? (
                <>
                  {showSignaturePad ? (
                    <SignaturePad
                      onSave={handleSaveSignature}
                      onCancel={() => setShowSignaturePad(false)}
                    />
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowSignaturePad(true)}
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      Ouvrir le pad de signature
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-green-50 p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">Signature enregistrée !</p>
                  </div>
                  <div className="rounded-lg border bg-white p-2">
                    <img
                      src={signatureDataUrl}
                      alt="Votre signature"
                      className="h-20 mx-auto object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSignatureDataUrl(null)
                      setShowSignaturePad(false)
                      setCurrentStep(2)
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Modifier la signature
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Step 3: Download PDF */}
        <Card className={currentStep >= 3 ? '' : 'opacity-50 pointer-events-none'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep > 3 ? 'bg-green-100 text-green-700' : currentStep >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > 3 ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              </div>
              <div>
                <CardTitle className="text-lg">Étape 3 — Télécharger le PDF</CardTitle>
                <CardDescription>Générez le devis signé au format PDF</CardDescription>
              </div>
            </div>
          </CardHeader>
          {currentStep >= 3 && (
            <CardContent className="space-y-4">
              {!pdfDownloaded ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le devis PDF (démo)
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-green-50 p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">PDF téléchargé avec succès !</p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setDepositDialogOpen(true)}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Marquer l&apos;acompte comme encaissé
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Step 4: Deposit Paid */}
        <Card className={currentStep >= 4 ? '' : 'opacity-50 pointer-events-none'}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                depositPaid ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
              }`}>
                {depositPaid ? <Check className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
              </div>
              <div>
                <CardTitle className="text-lg">Étape 4 — Acompte encaissé</CardTitle>
                <CardDescription>Confirmez la réception de l&apos;acompte</CardDescription>
              </div>
            </div>
          </CardHeader>
          {currentStep >= 4 && depositPaid && (
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Acompte encaissé
                  </Badge>
                  <span className="text-sm text-muted-foreground">Aujourd&apos;hui</span>
                </div>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(demoQuote.deposit_amount)}
                </p>
                <p className="text-sm text-green-700">
                  Méthode : {selectedMethod && depositMethodLabels[selectedMethod]}
                </p>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-primary mx-auto" />
                <p className="font-semibold text-lg">Bravo ! Vous avez terminé la démo 🎉</p>
                <p className="text-sm text-muted-foreground">
                  C&apos;est aussi simple que ça avec ChantiPay. Prêt à gagner du temps ?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button className="w-full" size="lg" asChild>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Créer mon compte gratuitement
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l&apos;accueil
                  </Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </main>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer l&apos;acompte comme encaissé</DialogTitle>
            <DialogDescription>
              Choisissez la méthode de paiement utilisée par le client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {(Object.keys(depositMethodLabels) as DepositMethod[]).map((method) => (
              <Button
                key={method}
                variant={selectedMethod === method ? 'default' : 'outline'}
                className="h-auto py-3 flex-col"
                onClick={() => setSelectedMethod(method)}
              >
                {depositMethodLabels[method]}
              </Button>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDepositDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              disabled={!selectedMethod}
              className="w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
