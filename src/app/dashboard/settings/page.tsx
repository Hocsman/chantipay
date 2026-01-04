'use client'

import { useState, useRef } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
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
import { Loader2, Save, Upload, Building2, CreditCard, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { uploadCompanyLogo, deleteCompanyLogo } from '@/lib/uploadLogo'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // État du formulaire (pré-rempli avec des données de démo)
  const [formData, setFormData] = useState({
    companyName: 'Dupont Plomberie',
    fullName: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78',
    address: '15 Rue de la République, 75001 Paris',
    siret: '123 456 789 00012',
    vatNumber: 'FR12345678901',
    defaultVatRate: '10',
    defaultDepositPercent: '30',
    pdfFooterText: 'Merci pour votre confiance. Règlement à réception de facture.',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      // TODO: Récupérer le vrai userId depuis la session
      const userId = 'demo-user-123'
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
    if (!logoUrl) return

    try {
      const userId = 'demo-user-123'
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
              Ces informations apparaîtront sur vos devis
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
                />
              </div>
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
                >
                  <SelectTrigger id="defaultVatRate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5.5">5,5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
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
