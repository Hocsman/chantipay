'use client'
import { withPermission } from '@/components/team/PermissionGate'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, FileText, Info, AlertCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface FecPreview {
  invoiceCount: number
  creditNoteCount: number
  totalHT: number
  totalTVA: number
  totalTTC: number
}

function ExportComptablePage() {
  const currentYear = new Date().getFullYear()
  const [fromDate, setFromDate] = useState(`${currentYear - 1}-01-01`)
  const [toDate, setToDate] = useState(`${currentYear - 1}-12-31`)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [preview, setPreview] = useState<FecPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const setYear = (year: number) => {
    setFromDate(`${year}-01-01`)
    setToDate(`${year}-12-31`)
    setPreview(null)
    setError(null)
  }

  const loadPreview = async () => {
    setIsLoadingPreview(true)
    setError(null)
    setErrorCode(null)
    setPreview(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Non authentifié')
        return
      }

      // Vérifier le SIRET
      const { data: profile } = await supabase
        .from('profiles')
        .select('siret')
        .eq('id', user.id)
        .single()

      const siret = profile?.siret?.replace(/\s/g, '') || ''
      if (!siret || siret.length < 9) {
        setError('Veuillez renseigner votre numéro SIRET dans les paramètres avant de générer le FEC.')
        setErrorCode('MISSING_SIRET')
        return
      }

      // Compter les factures
      const { data: invoices } = await supabase
        .from('invoices')
        .select('subtotal, tax_amount, total')
        .eq('user_id', user.id)
        .gte('issue_date', fromDate)
        .lte('issue_date', toDate)
        .not('payment_status', 'in', '("draft","canceled")')

      // Compter les avoirs
      const { data: creditNotes } = await supabase
        .from('credit_notes')
        .select('subtotal, tax_amount, total')
        .eq('user_id', user.id)
        .eq('status', 'finalized')
        .gte('issue_date', fromDate)
        .lte('issue_date', toDate)

      const invList = invoices || []
      const cnList = creditNotes || []

      if (invList.length === 0 && cnList.length === 0) {
        setError('Aucune écriture comptable trouvée pour cette période.')
        return
      }

      const totalHT = invList.reduce((s, i) => s + (i.subtotal || 0), 0)
        + cnList.reduce((s, c) => s + (c.subtotal || 0), 0)
      const totalTVA = invList.reduce((s, i) => s + (i.tax_amount || 0), 0)
        + cnList.reduce((s, c) => s + (c.tax_amount || 0), 0)
      const totalTTC = invList.reduce((s, i) => s + (i.total || 0), 0)
        + cnList.reduce((s, c) => s + (c.total || 0), 0)

      setPreview({
        invoiceCount: invList.length,
        creditNoteCount: cnList.length,
        totalHT,
        totalTVA,
        totalTTC,
      })
    } catch {
      setError('Erreur lors du chargement de l\'aperçu')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDownload = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/fec/export?from=${fromDate}&to=${toDate}`)

      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'MISSING_SIRET') {
          setError(data.details)
          setErrorCode('MISSING_SIRET')
        } else {
          setError(data.error || 'Erreur lors de la génération du FEC')
        }
        return
      }

      // Télécharger le fichier
      const blob = await response.blob()
      const filename = response.headers.get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] || 'FEC.txt'

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Fichier FEC téléchargé avec succès')
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  return (
    <LayoutContainer>
      <PageHeader
        title="Export comptable"
        description="Générez votre Fichier des Écritures Comptables (FEC) pour votre expert-comptable"
      />

      <div className="space-y-6">
        {/* Card info */}
        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>
                Le <strong className="text-foreground">FEC</strong> (Fichier des Écritures Comptables) est un fichier standardisé
                que votre comptable peut importer directement dans son logiciel.
                Il contient toutes vos écritures de ventes (factures et avoirs) pour la période sélectionnée.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sélection de période */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Période
            </CardTitle>
            <CardDescription>
              Sélectionnez la période comptable à exporter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Raccourcis année */}
            <div className="flex flex-wrap gap-2">
              {[currentYear - 1, currentYear - 2, currentYear].map((year) => (
                <Button
                  key={year}
                  type="button"
                  variant={fromDate === `${year}-01-01` && toDate === `${year}-12-31` ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setYear(year)}
                >
                  Année {year}
                </Button>
              ))}
            </div>

            <Separator />

            {/* Date inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromDate">Du</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPreview(null)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">Au</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setPreview(null)
                  }}
                />
              </div>
            </div>

            {/* Bouton aperçu */}
            <Button
              type="button"
              variant="outline"
              onClick={loadPreview}
              disabled={isLoadingPreview}
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Voir l\'aperçu'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Erreur */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-destructive font-medium">{error}</p>
                {errorCode === 'MISSING_SIRET' && (
                  <Link href="/dashboard/settings" className="inline-block mt-2">
                    <Button type="button" size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1.5" />
                      Aller aux paramètres
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aperçu */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>
                Récapitulatif des écritures pour la période du {new Date(fromDate).toLocaleDateString('fr-FR')} au {new Date(toDate).toLocaleDateString('fr-FR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Factures</p>
                  <p className="text-2xl font-bold">{preview.invoiceCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">Avoirs</p>
                  <p className="text-2xl font-bold">{preview.creditNoteCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">CA HT</p>
                  <p className="text-2xl font-bold">{formatCurrency(preview.totalHT)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">TVA collectée</p>
                  <p className="text-2xl font-bold">{formatCurrency(preview.totalTVA)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="font-medium">Total TTC</p>
                  <p className="text-sm text-muted-foreground">
                    {preview.invoiceCount} facture{preview.invoiceCount > 1 ? 's' : ''}
                    {preview.creditNoteCount > 0 && ` + ${preview.creditNoteCount} avoir${preview.creditNoteCount > 1 ? 's' : ''}`}
                  </p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(preview.totalTTC)}</p>
              </div>

              <Separator />

              {/* Bouton télécharger */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">TSV</Badge>
                  <span className="text-sm text-muted-foreground">Format FEC standard</span>
                </div>
                <Button onClick={handleDownload} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le FEC
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutContainer>
  )
}

export default withPermission(ExportComptablePage, undefined, { ownerOnly: true })
