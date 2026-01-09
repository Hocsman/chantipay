'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, FileText, Euro, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/mobile/EmptyState'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  issue_date: string
  due_date?: string
  total: number
  payment_status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'
  paid_amount?: number
  items?: InvoiceItem[]
}

const paymentStatusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'Payée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  overdue: { label: 'Retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  canceled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'

export default function MobileInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    // Filtrage par statut
    const matchesStatus = filter === 'all' || invoice.payment_status === filter
    
    // Recherche étendue
    if (!searchQuery) return matchesStatus
    
    const searchLower = searchQuery.toLowerCase()
    const totalAmount = invoice.total?.toString() || '0'
    const itemsDescriptions = invoice.items?.map(item => item.description.toLowerCase()).join(' ') || ''
    
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.client_name.toLowerCase().includes(searchLower) ||
      totalAmount.includes(searchQuery) ||
      itemsDescriptions.includes(searchLower)
    
    return matchesStatus && matchesSearch
  })

  const totalRevenue = invoices
    .filter(i => i.payment_status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const pendingAmount = invoices
    .filter(i => i.payment_status === 'sent' || i.payment_status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  if (isLoading) {
    return (
      <MobileAppShell title="Factures" subtitle="Gérez vos factures">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title="Factures"
      subtitle="Gérez vos factures"
    >
      <div className="p-4 space-y-4">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500 rounded">
                  <Euro className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Encaissé</p>
                  <p className="text-lg font-bold">{totalRevenue.toFixed(0)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500 rounded">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">En attente</p>
                  <p className="text-lg font-bold">{pendingAmount.toFixed(0)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, montant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes ({invoices.length})
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
        </div>

        {/* Liste des factures */}
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucune facture"
            description={
              filter === 'all'
                ? 'Créez votre première facture pour facturer vos clients.'
                : `Aucune facture avec le statut "${paymentStatusConfig[filter as keyof typeof paymentStatusConfig]?.label}"`
            }
            action={{
              label: 'Créer une facture',
              onClick: () => router.push('/mobile/factures/new'),
            }}
            variant="colorful"
          />
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => router.push(`/mobile/factures/${invoice.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="font-semibold text-base truncate">{invoice.invoice_number}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{invoice.client_name}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ml-2',
                      paymentStatusConfig[invoice.payment_status].color
                    )}>
                      {paymentStatusConfig[invoice.payment_status].label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <div className="font-bold text-lg">
                      {invoice.total.toFixed(2)} €
                    </div>
                  </div>

                  {invoice.payment_status === 'partial' && invoice.paid_amount && (
                    <div className="mt-2 pt-2 border-t text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600">Payé : {invoice.paid_amount.toFixed(2)} €</span>
                        <span className="text-orange-600">Reste : {(invoice.total - invoice.paid_amount).toFixed(2)} €</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <FloatingActionButton href="/mobile/factures/new" label="Nouvelle facture" />
    </MobileAppShell>
  )
}
