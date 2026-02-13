'use client'

import { useState, useRef, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/components/theme/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Upload, Building2, CreditCard, X, Palette, BookOpen, AlertCircle, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { uploadCompanyLogo, deleteCompanyLogo } from '@/lib/uploadLogo'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // État du formulaire
  const [formData, setFormData] = useState({
    // Infos entreprise (profiles)
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
    vatNumber: '',
    taxStatus: 'standard' as 'standard' | 'auto_entrepreneur' | 'micro_entreprise',
    isSubcontractor: false,
    rcs: '',
    apeCode: '',
    shareCapital: '',
    // Paramètres (settings)
    defaultVatRate: '20',
    defaultDepositPercent: '30',
    pdfFooterText: '',
  })

  // Charger les données utilisateur
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoadingData(false)
        return
      }

      setUserId(user.id)

      // Charger le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Charger les settings
      const { data: settings } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Charger le logo
      const { data: logoData } = await supabase.storage
        .from('logos')
        .list(user.id, { limit: 1 })

      if (logoData && logoData.length > 0) {
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(`${user.id}/${logoData[0].name}`)
        setLogoUrl(publicUrl)
      }

      // Remplir le formulaire
      if (profile) {
        setFormData(prev => ({
          ...prev,
          companyName: profile.company_name || '',
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          siret: profile.siret || '',
          vatNumber: profile.vat_number || '',
          taxStatus: profile.tax_status || 'standard',
          isSubcontractor: profile.is_subcontractor || false,
          rcs: profile.rcs || '',
          apeCode: profile.ape_code || '',
          shareCapital: profile.share_capital || '',
        }))
      }

      if (settings) {
        setFormData(prev => ({
          ...prev,
          defaultVatRate: String(settings.default_vat_rate || 20),
          defaultDepositPercent: String(settings.default_deposit_percent || 30),
          pdfFooterText: settings.pdf_footer_text || '',
        }))
      }

      setIsLoadingData(false)
    }

    loadUserData()
  }, [])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!userId) {
      toast.error('Utilisateur non authentifié')
      return
    }

    setIsUploadingLogo(true)
    try {
      const url = await uploadCompanyLogo(file, userId)

      if (url) {
        setLogoUrl(url)
        toast.success('Logo téléversé avec succès')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du téléversement')
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleLogoDelete = async () => {
    if (!logoUrl || !userId) return

    try {
      await deleteCompanyLogo(logoUrl, userId)
      setLogoUrl(null)
      toast.success('Logo supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_logo_url: logoUrl,
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde')

      toast.success('Paramètres sauvegardés avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Paramètres"
        description="Configurez votre compte et vos préférences"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de l'entreprise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations de l&apos;entreprise
            </CardTitle>
            <CardDescription>
              Ces informations apparaîtront sur vos devis et factures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Votre entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Prénom Nom"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Adresse complète"
                rows={2}
              />
            </div>

            <Separator />

            {/* Informations légales */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siret">N° SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleChange('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">N° TVA intracommunautaire</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => handleChange('vatNumber', e.target.value)}
                  placeholder="FR12345678901"
                  disabled={formData.taxStatus === 'auto_entrepreneur'}
                />
                {formData.taxStatus === 'auto_entrepreneur' && (
                  <p className="text-xs text-muted-foreground">Non applicable pour les auto-entrepreneurs</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="rcs">N° RCS (optionnel)</Label>
                <Input
                  id="rcs"
                  value={formData.rcs}
                  onChange={(e) => handleChange('rcs', e.target.value)}
                  placeholder="Paris B 123 456 789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apeCode">Code APE/NAF</Label>
                <Input
                  id="apeCode"
                  value={formData.apeCode}
                  onChange={(e) => handleChange('apeCode', e.target.value)}
                  placeholder="4321A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shareCapital">Capital social</Label>
                <Input
                  id="shareCapital"
                  value={formData.shareCapital}
                  onChange={(e) => handleChange('shareCapital', e.target.value)}
                  placeholder="10 000 €"
                />
              </div>
            </div>

            <Separator />

            {/* Statut fiscal */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxStatus">Statut fiscal</Label>
                <Select
                  value={formData.taxStatus}
                  onValueChange={(value) => handleChange('taxStatus', value)}
                >
                  <SelectTrigger id="taxStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Entreprise avec TVA</SelectItem>
                    <SelectItem value="auto_entrepreneur">Auto-entrepreneur (franchise TVA)</SelectItem>
                    <SelectItem value="micro_entreprise">Micro-entreprise avec TVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alerte auto-entrepreneur */}
              {formData.taxStatus === 'auto_entrepreneur' && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Mention légale auto-entrepreneur
                    </p>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      La mention &quot;TVA non applicable, article 293B du CGI&quot; sera automatiquement ajoutée sur vos devis et factures.
                    </p>
                  </div>
                </div>
              )}

              {/* Sous-traitance */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isSubcontractor" className="text-base">
                    Activité de sous-traitance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Cochez si vous travaillez en sous-traitance (autoliquidation de la TVA)
                  </p>
                </div>
                <Switch
                  id="isSubcontractor"
                  checked={formData.isSubcontractor}
                  onCheckedChange={(checked) => handleChange('isSubcontractor', checked)}
                />
              </div>

              {/* Alerte sous-traitance */}
              {formData.isSubcontractor && (
                <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Mention légale sous-traitance
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      La mention &quot;Autoliquidation de la TVA - Article 283-2 nonies du CGI&quot; sera automatiquement ajoutée sur vos factures de sous-traitance.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Logo de l&apos;entreprise</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative h-20 w-20 rounded-lg border-2 border-border overflow-hidden bg-white">
                    <Image
                      src={logoUrl}
                      alt="Logo entreprise"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingLogo ? 'Téléversement...' : logoUrl ? 'Changer le logo' : 'Téléverser un logo'}
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleLogoDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Format : PNG ou JPG, max 1 Mo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres des devis */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres des devis</CardTitle>
            <CardDescription>
              Valeurs par défaut pour vos nouveaux devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultVatRate">Taux de TVA par défaut</Label>
                <Select
                  value={formData.defaultVatRate}
                  onValueChange={(value) => handleChange('defaultVatRate', value)}
                  disabled={formData.taxStatus === 'auto_entrepreneur'}
                >
                  <SelectTrigger id="defaultVatRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exonéré)</SelectItem>
                    <SelectItem value="5.5">5,5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
                {formData.taxStatus === 'auto_entrepreneur' && (
                  <p className="text-xs text-muted-foreground">TVA non applicable pour les auto-entrepreneurs</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDepositPercent">Acompte par défaut</Label>
                <Select
                  value={formData.defaultDepositPercent}
                  onValueChange={(value) => handleChange('defaultDepositPercent', value)}
                >
                  <SelectTrigger id="defaultDepositPercent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pas d&apos;acompte</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdfFooterText">Texte de pied de page des devis</Label>
              <Textarea
                id="pdfFooterText"
                value={formData.pdfFooterText}
                onChange={(e) => handleChange('pdfFooterText', e.target.value)}
                placeholder="Conditions de règlement, mentions légales..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thème */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Apparence
            </CardTitle>
            <CardDescription>
              Personnalisez l&apos;apparence de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Thème</Label>
                <p className="text-sm text-muted-foreground">
                  Choisissez entre le mode clair, sombre ou automatique
                </p>
              </div>
              <ThemeToggle />
            </div>
            <ThemePreview />
          </CardContent>
        </Card>

        {/* Ma bibliothèque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ma bibliothèque
            </CardTitle>
            <CardDescription>
              Gérez vos lignes de devis favorites pour les réutiliser rapidement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lignes de devis favorites</p>
                <p className="text-sm text-muted-foreground">Catégorisées par métier • Export/Import JSON</p>
              </div>
              <Link href="/dashboard/settings/library">
                <Button variant="outline">
                  Gérer ma bibliothèque
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gestion d'équipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestion d&apos;équipe
            </CardTitle>
            <CardDescription>
              Invitez des membres et gérez leurs permissions d&apos;accès
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Membres de l&apos;équipe</p>
                <p className="text-sm text-muted-foreground">Techniciens • Permissions configurables</p>
              </div>
              <Link href="/dashboard/settings/team">
                <Button variant="outline">
                  Gérer l&apos;équipe
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Lien vers la facturation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
            <CardDescription>
              Gérez votre abonnement et vos moyens de paiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plan Artisan Solo</p>
                <p className="text-sm text-muted-foreground">19€/mois • Période d&apos;essai</p>
              </div>
              <Link href="/dashboard/settings/billing">
                <Button variant="outline">
                  Gérer l&apos;abonnement
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pb-24">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </LayoutContainer>
  )
}

// Theme preview component
function ThemePreview() {
  const { theme, resolvedTheme } = useTheme()

  const themeLabels: Record<string, string> = {
    light: 'Clair',
    dark: 'Sombre',
    system: 'Automatique',
  }

  const resolvedLabels: Record<string, string> = {
    light: 'clair',
    dark: 'sombre',
  }

  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Mode actuel:</span>
        <span className="font-medium">{themeLabels[theme]}</span>
      </div>
      {theme === 'system' && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground">Détecté:</span>
          <span className="font-medium">Thème {resolvedLabels[resolvedTheme]}</span>
        </div>
      )}
    </div>
  )
}
