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
import { Loader2, ArrowLeft, Save, FileText, Euro, Calendar, Send, CheckCircle2, Download, Building2, FileCode } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { downloadInvoicePDF } from '@/lib/pdf/InvoicePdf'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

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
  vat_rate?: number
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
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadInvoice(p.id)
    })
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, full_name, address, phone, email, siret')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        // Vérifier si un logo existe
        const { data: logoData } = await supabase.storage
          .from('logos')
          .list(user.id, { limit: 1 })
        
        const logoUrl = logoData && logoData.length > 0
          ? supabase.storage.from('logos').getPublicUrl(`${user.id}/${logoData[0].name}`).data.publicUrl
          : null
        
        setUserProfile({ ...profile, logo_url: logoUrl })
      }
    }
  }

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
      toast.error('⚠️ Aucun email client configuré', {
        description: 'Veuillez ajouter un email au client avant d\'envoyer la facture.'
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        // Gérer les différents types d'erreurs
        if (data.code === 'RESEND_NOT_CONFIGURED') {
          toast.error('📧 Service d\'email non configuré', {
            description: 'Contactez votre administrateur pour activer l\'envoi d\'emails. En attendant, vous pouvez télécharger le PDF et l\'envoyer manuellement.',
            duration: 6000
          })
        } else if (data.code === 'EMAIL_SEND_FAILED') {
          toast.error('❌ Échec de l\'envoi', {
            description: data.details || 'Impossible d\'envoyer l\'email. Vérifiez l\'adresse email du client.',
            duration: 5000
          })
        } else {
          toast.error('❌ Erreur lors de l\'envoi', {
            description: data.error || 'Une erreur est survenue'
          })
        }
        return
      }

      await loadInvoice(id)
      toast.success('✅ Email envoyé avec succès !', {
        description: `Facture envoyée à ${invoice.client_email}`
      })
    } catch (error) {
      console.error('Erreur send email:', error)
      toast.error('❌ Erreur réseau', {
        description: 'Impossible de contacter le serveur. Vérifiez votre connexion.'
      })
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
                          vat_rate: item.vat_rate, // ✅ Inclure la TVA par ligne
                        })) || [],
                      },
                      {
                        name: userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise',
                        address: userProfile?.address || '',
                        phone: userProfile?.phone || '',
                        email: userProfile?.email || '',
                        siret: userProfile?.siret || '',
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
              <Button
                variant="outline"
                onClick={async () => {
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
                    toast.success('✅ PDF Factur-X téléchargé', {
                      description: 'PDF/A-3 conforme EN 16931 avec XML embarqué'
                    })
                  } catch (error) {
                    console.error(error)
                    toast.error('Erreur lors du téléchargement Factur-X')
                  }
                }}
              >
                <FileCode className="mr-2 h-4 w-4" />
                Factur-X PDF
              </Button>
            </>
          )}
        </div>

        {/* Facture professionnelle - Design amélioré */}
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* En-tête de facture avec branding */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {userProfile?.logo_url ? (
                    <div className="bg-white rounded-lg p-2">
                      <Image
                        src={userProfile.logo_url}
                        alt="Logo entreprise"
                        width={60}
                        height={60}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-white/20 rounded-lg p-3">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">
                      {userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise'}
                    </h1>
                    <p className="text-blue-100 text-sm">Artisan professionnel</p>
                  </div>
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
                  <p className="font-bold text-lg mb-1">
                    {userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise'}
                  </p>
                  {userProfile?.address && (
                    <p className="text-sm text-muted-foreground">{userProfile.address}</p>
                  )}
                  {userProfile?.phone && (
                    <p className="text-sm text-muted-foreground mt-1">📞 {userProfile.phone}</p>
                  )}
                  {userProfile?.email && (
                    <p className="text-sm text-muted-foreground">✉ {userProfile.email}</p>
                  )}
                  {userProfile?.siret && (
                    <p className="text-sm text-muted-foreground mt-2 font-medium">SIRET : {userProfile.siret}</p>
                  )}
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
                        <th className="text-right px-4 py-3 text-sm font-semibold w-20">Qté</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-28">Prix HT</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-20">TVA</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold w-28">Total HT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.unit_price.toFixed(2)} €</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              item.vat_rate === 20 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                              item.vat_rate === 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              item.vat_rate === 5.5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                              "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                            )}>
                              {item.vat_rate ?? invoice.tax_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{item.total.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Récapitulatif TVA si mixte */}
              {invoice.items && invoice.items.some(item => item.vat_rate !== undefined) && (
                (() => {
                  const vatGroups = invoice.items!.reduce((acc, item) => {
                    const rate = item.vat_rate ?? invoice.tax_rate
                    if (!acc[rate]) acc[rate] = { base: 0, tax: 0 }
                    acc[rate].base += item.total
                    acc[rate].tax += item.total * (rate / 100)
                    return acc
                  }, {} as Record<number, { base: number; tax: number }>)
                  
                  const rateCount = Object.keys(vatGroups).length
                  
                  return rateCount > 1 ? (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                        📊 Détail TVA (taux multiples)
                      </div>
                      <div className="space-y-1">
                        {Object.entries(vatGroups).map(([rate, values]) => (
                          <div key={rate} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              TVA {rate}% (base: {values.base.toFixed(2)} €)
                            </span>
                            <span className="font-medium">{values.tax.toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()
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
    </LayoutContainer>
  )
}
