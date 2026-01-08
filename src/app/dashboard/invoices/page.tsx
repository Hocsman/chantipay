'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Loader2, Plus, FileText, Euro } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  issue_date: string
  due_date?: string
  total: number
  payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
  paid_amount?: number
}

const paymentStatusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'Paiement partiel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  canceled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setInvoices(data.invoices)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des factures')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true
    return invoice.payment_status === filter
  })

  const totalRevenue = invoices
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const pendingAmount = invoices
    .filter(i => i.payment_status === 'sent' || i.payment_status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Factures" description="Gérez vos factures clients" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader title="Factures" description="Gérez vos factures clients" />

      {/* Bouton création desktop */}
      <div className="hidden md:flex justify-end mb-6">
        <Button onClick={() => router.push('/dashboard/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Euro className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encaissé</p>
                <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{pendingAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({invoices.length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Brouillons ({invoices.filter(i => i.payment_status === 'draft').length})
        </Button>
        <Button
          variant={filter === 'sent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('sent')}
        >
          Envoyées ({invoices.filter(i => i.payment_status === 'sent').length})
        </Button>
        <Button
          variant={filter === 'paid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('paid')}
        >
          Payées ({invoices.filter(i => i.payment_status === 'paid').length})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
        >
          En retard ({invoices.filter(i => i.payment_status === 'overdue').length})
        </Button>
      </div>

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {filter === 'all'
                ? "Créez votre première facture pour facturer vos clients."
                : `Aucune facture avec le statut "${paymentStatusConfig[filter as keyof typeof paymentStatusConfig]?.label}"`
              }
            </p>
            <Button onClick={() => router.push('/dashboard/invoices/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une facture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold text-base">{invoice.invoice_number}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.client_name}</p>
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                    paymentStatusConfig[invoice.payment_status].color
                  )}>
                    {paymentStatusConfig[invoice.payment_status].label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Émise le {new Date(invoice.issue_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {invoice.due_date && (
                      <span>
                        Échéance : {new Date(invoice.due_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-lg">
                    {invoice.total.toFixed(2)} €
                  </div>
                </div>

                {invoice.payment_status === 'partial' && invoice.paid_amount && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Payé : {invoice.paid_amount.toFixed(2)} € / Reste : {(invoice.total - invoice.paid_amount).toFixed(2)} €
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB pour mobile */}
      <FloatingActionButton href="/dashboard/invoices/new" label="Nouvelle facture" />
    </LayoutContainer>
  )
}
