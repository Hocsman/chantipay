'use client'
import { withPermission } from '@/components/team/PermissionGate'

import { useState, useRef, useCallback, useEffect } from 'react'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Landmark,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// ============================================
// Types
// ============================================

interface BankTransaction {
  id: string
  transaction_date: string
  label: string
  amount: number
  reference: string | null
  reconciled_method: string | null
  invoice_id: string | null
  invoice: {
    id: string
    invoice_number: string
    client_name: string
    total: number
    payment_status: string
  } | null
}

interface Stats {
  total: number
  credits: number
  totalCredits: number
  matched: number
  totalMatched: number
  unmatched: number
  totalUnmatched: number
}

interface ImportResult {
  imported: number
  duplicates: number
  matched: number
  unmatched: number
  message?: string
}

// ============================================
// Page
// ============================================

function BankingPage() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  // Charger les transactions
  const loadTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/banking/transactions?status=${filter}`)
      if (!res.ok) return
      const data = await res.json()
      setTransactions(data.transactions || [])
      setStats(data.stats || null)
    } catch {
      // silencieux
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Upload de fichier
  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/banking/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'import')
        return
      }

      setImportResult(data)

      if (data.imported > 0) {
        toast.success(
          `${data.imported} transaction${data.imported > 1 ? 's' : ''} importée${data.imported > 1 ? 's' : ''}` +
          (data.matched > 0 ? `, ${data.matched} rapprochée${data.matched > 1 ? 's' : ''}` : '')
        )
        loadTransactions()
      } else if (data.message) {
        toast.info(data.message)
      }
    } catch {
      toast.error('Erreur lors de l\'import')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  // Drag & drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const onDragLeave = () => setIsDragOver(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Module Bancaire"
        description="Importez vos relevés bancaires pour rapprocher automatiquement vos factures"
      />

      <div className="space-y-6">
        {/* Zone d'import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Importer un relevé bancaire
            </CardTitle>
            <CardDescription>
              Exportez votre relevé depuis votre banque en ligne (format CSV ou OFX)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.ofx,.qfx"
                onChange={onFileChange}
                className="hidden"
                id="bank-file"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Import et rapprochement en cours...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Déposez votre fichier ici</p>
                    <p className="text-sm text-muted-foreground">ou</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choisir un fichier
                  </Button>
                  <p className="text-xs text-muted-foreground">CSV, OFX ou QFX</p>
                </div>
              )}
            </div>

            {/* Résultat d'import */}
            {importResult && (
              <div className="mt-4 rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Import terminé</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Importées</p>
                    <p className="font-bold text-lg">{importResult.imported}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Doublons ignorés</p>
                    <p className="font-bold text-lg">{importResult.duplicates}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rapprochées</p>
                    <p className="font-bold text-lg text-green-600">{importResult.matched}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Non rapprochées</p>
                    <p className="font-bold text-lg text-amber-600">{importResult.unmatched}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Encaissements importés</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCredits)}</p>
                <p className="text-xs text-muted-foreground">{stats.credits} transaction{stats.credits > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Rapprochés</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalMatched)}</p>
                <p className="text-xs text-muted-foreground">{stats.matched} facture{stats.matched > 1 ? 's' : ''} liée{stats.matched > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalUnmatched)}</p>
                <p className="text-xs text-muted-foreground">{stats.unmatched} non rapprochée{stats.unmatched > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtres + Tableau */}
        {stats && stats.total > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transactions</CardTitle>
                <div className="flex gap-1">
                  {(['all', 'matched', 'unmatched'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'Toutes' : f === 'matched' ? 'Rapprochées' : 'Non rapprochées'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Header */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-4">Libellé</div>
                  <div className="col-span-2 text-right">Montant</div>
                  <div className="col-span-3">Facture</div>
                  <div className="col-span-1">Statut</div>
                </div>
                <Separator />

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <p className="text-sm">Aucune transaction</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 px-3 py-3 rounded-lg hover:bg-muted/50 text-sm ${
                        tx.amount < 0 ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Date */}
                      <div className="sm:col-span-2 flex items-center gap-2">
                        {tx.amount >= 0 ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <span className="text-muted-foreground">{formatDate(tx.transaction_date)}</span>
                      </div>

                      {/* Libellé */}
                      <div className="sm:col-span-4 truncate" title={tx.label}>
                        {tx.label}
                        {tx.reference && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Réf: {tx.reference}
                          </span>
                        )}
                      </div>

                      {/* Montant */}
                      <div className={`sm:col-span-2 text-right font-medium ${
                        tx.amount >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </div>

                      {/* Facture liée */}
                      <div className="sm:col-span-3">
                        {tx.invoice ? (
                          <Link
                            href={`/dashboard/invoices/${tx.invoice.id}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            {tx.invoice.invoice_number}
                            <span className="text-muted-foreground text-xs">— {tx.invoice.client_name}</span>
                          </Link>
                        ) : tx.amount > 0 ? (
                          <span className="text-xs text-muted-foreground">Non rapprochée</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Statut */}
                      <div className="sm:col-span-1">
                        {tx.invoice_id ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" />
                            OK
                          </Badge>
                        ) : tx.amount > 0 ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-[10px]">
                            <AlertCircle className="h-3 w-3 mr-0.5" />
                            ?
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info si aucune transaction */}
        {!isLoading && stats && stats.total === 0 && !importResult && (
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Comment ça fonctionne ?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Connectez-vous à votre banque en ligne</li>
                  <li>Exportez votre relevé de compte au format CSV ou OFX</li>
                  <li>Importez-le ici — ChantiPay rapproche automatiquement les paiements avec vos factures</li>
                </ol>
                <p className="mt-2">
                  Les factures dont le montant correspond exactement à une transaction seront automatiquement marquées comme payées.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutContainer>
  )
}

export default withPermission(BankingPage, undefined, { ownerOnly: true })
