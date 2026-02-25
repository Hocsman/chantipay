'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileText, Euro, Calendar, Send, CheckCircle2, ArrowLeft, Download, Building2, FileCode } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
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
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
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
  partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Euro },
  overdue: { label: 'Retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Calendar },
  canceled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
}

export default function InvoiceDetailMobilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
        router.push('/mobile/factures')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
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
            description: 'Téléchargez le PDF et envoyez-le manuellement en attendant.',
            duration: 6000
          })
        } else if (data.code === 'EMAIL_SEND_FAILED') {
          toast.error('❌ Échec de l\'envoi', {
            description: data.details || 'Vérifiez l\'adresse email du client.',
            duration: 5000
          })
        } else {
          toast.error('❌ Erreur lors de l\'envoi', {
            description: data.error || 'Une erreur est survenue'
          })
        }
        return
      }

      await loadInvoice(invoice.id)
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

  if (isLoading) {
    return (
      <MobileAppShell title="Facture">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    )
  }

  if (!invoice) {
    return null
  }

  const StatusIcon = paymentStatusConfig[invoice.payment_status].icon

  return (
    <MobileAppShell title={invoice.invoice_number}>
      <div className="p-4 space-y-4">
        {/* Statut et actions rapides */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-sm">{invoice.client_name}</p>
                <span className={cn(
                  'inline-block text-xs font-medium px-2 py-1 rounded-full',
                  paymentStatusConfig[invoice.payment_status].color
                )}>
                  {paymentStatusConfig[invoice.payment_status].label}
                </span>
              </div>
            </div>
            
            {invoice.payment_status === 'draft' && (
              <Button size="sm" variant="outline" onClick={markAsSent} className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Marquer envoyée
              </Button>
            )}
            
            {(invoice.payment_status === 'sent' || invoice.payment_status === 'overdue') && (
              <Button size="sm" onClick={markAsPaid} className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marquer payée
              </Button>
            )}
          </CardContent>
        </Card>

        {/* En-tête facture avec branding */}
        <Card className="overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-5 text-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {userProfile?.logo_url ? (
                  <div className="bg-white rounded-lg p-1.5">
                    <Image
                      src={userProfile.logo_url}
                      alt="Logo"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white/20 rounded-lg p-2">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <h1 className="text-lg font-bold">
                  {userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise'}
                </h1>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-100 mb-1">FACTURE</div>
                <div className="text-lg font-bold">{invoice.invoice_number}</div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-0">
            {/* Informations entreprise et client */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 space-y-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Facturé par
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                  <p className="font-bold text-sm mb-1">
                    {userProfile?.company_name || userProfile?.full_name || 'Mon Entreprise'}
                  </p>
                  {userProfile?.address && (
                    <p className="text-xs text-muted-foreground">{userProfile.address}</p>
                  )}
                  {userProfile?.phone && (
                    <p className="text-xs text-muted-foreground mt-1">📞 {userProfile.phone}</p>
                  )}
                  {userProfile?.email && (
                    <p className="text-xs text-muted-foreground">✉ {userProfile.email}</p>
                  )}
                  {userProfile?.siret && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium">SIRET: {userProfile.siret}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Facturé à
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                  <p className="font-bold text-sm mb-1">{invoice.client_name}</p>
                  {invoice.client_email && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <span>✉</span> {invoice.client_email}
                    </p>
                  )}
                  {invoice.client_phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>📞</span> {invoice.client_phone}
                    </p>
                  )}
                  {invoice.client_address && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <span>📍</span> {invoice.client_address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-y space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Date d'émission</span>
                <span className="font-semibold">
                  {new Date(invoice.issue_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {invoice.due_date && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Date d'échéance</span>
                  <span className="font-semibold text-orange-600">
                    {new Date(invoice.due_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Payée le</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {new Date(invoice.paid_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Détails et lignes */}
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                Détails de la facture
              </h3>
              
              {invoice.items && invoice.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-semibold">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2 text-center">Qté</div>
                    <div className="col-span-2 text-center">TVA</div>
                    <div className="col-span-3 text-right">Total</div>
                  </div>
                  <div className="divide-y">
                    {invoice.items.map((item, index) => (
                      <div key={index} className="px-3 py-2 grid grid-cols-12 gap-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-900/20">
                        <div className="col-span-5">
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <div className="col-span-2 text-center text-sm font-medium">{item.quantity}</div>
                        <div className="col-span-2 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-medium",
                            (item.vat_rate ?? invoice.tax_rate) === 20 ? "bg-blue-100 text-blue-700" :
                            (item.vat_rate ?? invoice.tax_rate) === 10 ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {item.vat_rate ?? invoice.tax_rate}%
                          </span>
                        </div>
                        <div className="col-span-3 text-right text-sm font-semibold">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </div>
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
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                      <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-2">
                        📊 Détail TVA
                      </div>
                      <div className="space-y-1">
                        {Object.entries(vatGroups).map(([rate, values]) => (
                          <div key={rate} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">TVA {rate}%</span>
                            <span className="font-medium">{formatCurrency(values.tax)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                })()
              )}

              {/* Totaux */}
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">TVA ({invoice.tax_rate}%)</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 pt-2 mt-2">
                  <span>Total TTC</span>
                  <span className="text-blue-600">{formatCurrency(invoice.total)}</span>
                </div>
                
                {invoice.payment_status === 'partial' && invoice.paid_amount && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 font-medium pt-2 border-t">
                      <span>Montant payé</span>
                      <span>{formatCurrency(invoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600 font-semibold">
                      <span>Reste à payer</span>
                      <span>{formatCurrency((invoice.total - invoice.paid_amount))}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'action */}
        <div className="space-y-2">
          <Button
            variant="default"
            onClick={sendEmail}
            disabled={isSendingEmail || !invoice.client_email}
            className="w-full"
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
                    logo: userProfile?.logo_url || undefined,
                  }
                )
                toast.success('PDF téléchargé')
              } catch (error) {
                console.error(error)
                toast.error('Erreur lors du téléchargement')
              }
            }}
            className="w-full"
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
                  description: 'Format conforme EN 16931 avec XML embarqué'
                })
              } catch (error) {
                console.error(error)
                toast.error('Erreur lors du téléchargement Factur-X')
              }
            }}
            className="w-full"
          >
            <FileCode className="mr-2 h-4 w-4" />
            Factur-X (PDF)
          </Button>
        </div>
      </div>
    </MobileAppShell>
  )
}
