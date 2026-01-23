'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-orange-500/30">

      {/* Background Decor */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>
      <div className="fixed top-0 right-0 -z-10 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] opacity-20 translate-x-1/3 -translate-y-1/4 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <div className="relative h-8 w-8 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
              <Image
                src="/favicon.svg"
                alt="ChantiPay"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block group-hover:text-orange-500 transition-colors">ChantiPay</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">Mode Démo</div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quitter la démo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-4 py-12 relative z-10 space-y-12">

        {/* Title section */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-950/30 px-4 py-1.5 text-sm uppercase tracking-wider">
            Démonstration Interactive
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Testez</span> la puissance de ChantiPay
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Vivez l&apos;expérience du devis au paiement en moins de 2 minutes. Aucune inscription requise.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center w-full max-w-md relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>

            {[1, 2, 3, 4].map((step) => {
              const isActive = step <= currentStep;
              const isCompleted = step < currentStep;

              return (
                <div key={step} className="flex-1 flex justify-center">
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    isActive ? "bg-slate-950 border-orange-500 text-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]" : "bg-slate-950 border-white/10 text-gray-500",
                    isCompleted && "bg-orange-600 border-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                  )}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <span className="font-bold text-sm">{step}</span>}
                    {step === currentStep && (
                      <span className="absolute -bottom-8 text-xs font-medium text-orange-400 whitespace-nowrap">
                        {step === 1 && "Aperçu"}
                        {step === 2 && "Signature"}
                        {step === 3 && "PDF"}
                        {step === 4 && "Paiement"}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Quote Preview */}
        <div className={cn("transition-all duration-500", currentStep === 1 ? "opacity-100 translate-y-0" : currentStep > 1 ? "opacity-50 grayscale scale-95 hidden" : "opacity-0 translate-y-10 hidden")}>
          <Card className="bg-slate-900/50 border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">Aperçu du devis</CardTitle>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Brouillon</Badge>
              </div>
              <CardDescription className="text-gray-400">Vérifiez les informations avant envoi</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 space-y-6">

              {/* Paper Look */}
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-none sm:rounded-sm shadow-xl max-w-3xl mx-auto min-h-[600px] text-sm relative">
                {/* Ribbon */}
                <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                  <div className="bg-orange-500 text-white text-xs font-bold py-1 px-8 text-center transform rotate-45 translate-x-8 translate-y-4 shadow-md">DÉMO</div>
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-bold text-2xl text-slate-800 mb-1">{demoProfile.company_name}</h3>
                    <p className="text-slate-500">{demoProfile.address}</p>
                    <p className="text-slate-500">{demoProfile.postal_code} {demoProfile.city}</p>
                    <p className="text-slate-400 text-xs mt-2">SIRET: {demoProfile.siret}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold text-3xl text-slate-800 mb-2">DEVIS</h2>
                    <p className="font-mono text-slate-600">{demoQuote.quote_number}</p>
                    <p className="text-slate-500 text-xs mt-1">Date: {formatDate(new Date().toISOString())}</p>
                    <p className="text-slate-500 text-xs">Validité: {formatDate(demoQuote.valid_until)}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-md mb-8 border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-semibold">Client</p>
                  <p className="font-bold text-slate-800 text-lg">{demoClient.name}</p>
                  <p className="text-slate-600">{demoClient.address}</p>
                  <p className="text-slate-600">{demoClient.postal_code} {demoClient.city}</p>
                </div>

                <div className="mb-8">
                  <h4 className="font-bold text-slate-800">{demoQuote.title}</h4>
                  <p className="text-slate-600 mt-1">{demoQuote.description}</p>
                </div>

                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="text-left py-2 font-semibold text-slate-500 text-xs uppercase">Description</th>
                      <th className="text-right py-2 font-semibold text-slate-500 text-xs uppercase w-20">Qté</th>
                      <th className="text-right py-2 font-semibold text-slate-500 text-xs uppercase w-32">Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-3 text-slate-700">{item.description}</td>
                        <td className="py-3 text-right text-slate-600">{item.quantity} {item.unit}</td>
                        <td className="py-3 text-right font-medium text-slate-800">{formatCurrency(item.total_ht)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-8">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Total HT</span>
                      <span>{formatCurrency(demoQuote.total_ht)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>TVA ({demoQuote.vat_rate}%)</span>
                      <span>{formatCurrency(demoQuote.total_tva)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-slate-900 pt-3 border-t-2 border-slate-100">
                      <span>Total TTC</span>
                      <span>{formatCurrency(demoQuote.total_ttc)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-orange-800 uppercase tracking-wide">Acompte demandé ({demoQuote.deposit_percentage}%)</p>
                    <p className="text-xs text-orange-600">A payer à la signature</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(demoQuote.deposit_amount)}</p>
                </div>

              </div>

              <div className="p-4 sm:p-0">
                <Button className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(234,88,12,0.3)] transition-all hover:shadow-[0_0_30px_rgba(234,88,12,0.5)]" onClick={() => setCurrentStep(2)}>
                  Tout est bon, signer le devis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-center text-xs text-gray-500 mt-3">Cette action simulera l&apos;ouverture du module de signature</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Signature */}
        <div className={cn("transition-all duration-500", currentStep === 2 ? "opacity-100 translate-y-0" : currentStep !== 2 ? "hidden" : "")}>
          <Card className="bg-slate-900/50 border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-xl text-white">Signature électronique</CardTitle>
              <CardDescription className="text-gray-400">Signez directement à l&apos;écran avec votre doigt ou la souris</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {!signatureDataUrl ? (
                <>
                  {showSignaturePad ? (
                    <div className="bg-white rounded-xl overflow-hidden shadow-inner border-4 border-orange-500/20">
                      <SignaturePad
                        onSave={handleSaveSignature}
                        onCancel={() => setShowSignaturePad(false)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                        <Pen className="h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Prêt à signer ?</h3>
                      <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                        Plus besoin d&apos;imprimer. Faites signer vos clients directement sur votre téléphone ou tablette.
                      </p>
                      <Button
                        className="h-12 px-8 bg-orange-600 hover:bg-orange-500 text-white shadow-lg"
                        size="lg"
                        onClick={() => setShowSignaturePad(true)}
                      >
                        <Pen className="h-4 w-4 mr-2" />
                        Ouvrir le pad de signature
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Step 3: Download PDF */}
        <div className={cn("transition-all duration-500", currentStep === 3 ? "opacity-100 translate-y-0" : currentStep !== 3 ? "hidden" : "")}>
          <Card className="bg-slate-900/50 border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <CardTitle className="text-xl text-white">Génération du PDF</CardTitle>
              <CardDescription className="text-gray-400">Le devis signé est généré instantanément</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8 text-center py-12">

              {!pdfDownloaded ? (
                <div className="space-y-8">
                  <div className="inline-flex relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                    <CheckCircle className="h-24 w-24 text-green-500 relative z-10" strokeWidth={1.5} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Devis signé avec succès !</h3>
                    <p className="text-gray-400">Un PDF sécurisé a été généré avec la signature et les mentions légales.</p>
                  </div>

                  <Button
                    className="h-14 px-8 bg-white text-slate-900 hover:bg-gray-100 font-bold text-lg w-full sm:w-auto"
                    size="lg"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-3" />
                        Télécharger le devis PDF
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-500 mb-4 ring-2 ring-green-500/20">
                    <Download className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white">PDF téléchargé</h3>

                  <div className="p-6 bg-orange-950/20 border border-orange-500/20 rounded-xl max-w-lg mx-auto">
                    <p className="text-orange-400 font-semibold mb-1">Dernière étape !</p>
                    <p className="text-gray-400 text-sm">Maintenant que le devis est signé, il faut sécuriser l&apos;affaire en encaissant l&apos;acompte.</p>
                  </div>

                  <Button
                    className="h-14 px-8 w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                    size="lg"
                    onClick={() => setDepositDialogOpen(true)}
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    Encaisser l&apos;acompte
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step 4: Deposit Paid */}
        <div className={cn("transition-all duration-500", currentStep === 4 ? "opacity-100 translate-y-0" : currentStep !== 4 ? "hidden" : "")}>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none"></div>

            <CardContent className="p-8 sm:p-12 text-center space-y-8">

              <div className="scale-150 mb-8 inline-block">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full animate-pulse"></div>
                  <CheckCircle className="h-20 w-20 text-green-500 relative z-10" strokeWidth={1.5} />
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-extrabold text-white mb-2">Bravo ! 🎉</h2>
                <p className="text-xl text-gray-300">Vous avez terminé le parcours démo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Temps écoulé</p>
                  <p className="text-2xl font-bold text-white">1m 12s</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Acompte</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(demoQuote.deposit_amount)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Statut</p>
                  <p className="text-2xl font-bold text-blue-400">Validé</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto mt-8">
                <h3 className="text-xl font-bold text-white mb-4">Prêt à gagner du temps sur vos vrais chantiers ?</h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="h-12 px-8 bg-orange-600 hover:bg-orange-500 text-white font-bold w-full sm:w-auto" asChild>
                    <Link href="/register">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer mon compte (Essai 14j)
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-12 px-8 bg-transparent border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" asChild>
                    <Link href="/">
                      <Home className="h-4 w-4 mr-2" />
                      Retour à l&apos;accueil
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">Sans carte bancaire • Annulation à tout moment</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Deposit Dialog (Dark Mode) */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Marquer l&apos;acompte comme encaissé</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choisissez la méthode de paiement utilisée par le client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {(Object.keys(depositMethodLabels) as DepositMethod[]).map((method) => (
              <Button
                key={method}
                variant={'outline'}
                className={cn(
                  "h-auto py-3 flex-col border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all",
                  selectedMethod === method && "border-orange-500 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 hover:text-orange-400 ring-1 ring-orange-500"
                )}
                onClick={() => setSelectedMethod(method)}
              >
                {depositMethodLabels[method]}
              </Button>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => setDepositDialogOpen(false)}
              className="w-full sm:w-auto text-gray-400 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDeposit}
              disabled={!selectedMethod}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white"
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
