'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Loader2, Plus, FileText, Search, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ExportButton } from '@/components/ExportButton'

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
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
  sent: {
    label: 'Envoyée',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
  },
  paid: {
    label: 'Payée',
    className: 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/25'
  },
  partial: {
    label: 'Partiel',
    className: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25'
  },
  overdue: {
    label: 'En retard',
    className: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/25'
  },
  canceled: {
    label: 'Annulée',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'canceled'

export default function InvoicesPage() {
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
    const matchesStatus = filter === 'all' || invoice.payment_status === filter

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Calculer les statistiques
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.payment_status === 'paid').length,
    pending: invoices.filter(i => i.payment_status === 'sent').length,
    overdue: invoices.filter(i => i.payment_status === 'overdue').length,
    totalPaid: invoices.filter(i => i.payment_status === 'paid').reduce((sum, i) => sum + i.total, 0),
    totalPending: invoices.filter(i => i.payment_status === 'sent' || i.payment_status === 'overdue').reduce((sum, i) => sum + i.total, 0),
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Factures" description="Gérez vos factures clients" />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des factures...</p>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Factures"
        description="Gérez vos factures clients"
        action={
          <div className="flex items-center gap-2">
            <ExportButton
              type="invoices"
              filters={{ status: filter !== 'all' ? filter : undefined }}
              className="hidden sm:flex"
            />
            <Button
              onClick={() => router.push('/dashboard/invoices/new')}
              className="hidden sm:flex gap-2 shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Button>
          </div>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground">Total factures</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 border border-green-500/10">
          <p className="text-sm text-muted-foreground">Payées</p>
          <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 border border-blue-500/10">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Encaissé</p>
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, client, montant ou prestation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12"
        />
      </div>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Toutes', value: 'all' as const },
          { label: 'Brouillons', value: 'draft' as const },
          { label: 'Envoyées', value: 'sent' as const },
          { label: 'Payées', value: 'paid' as const },
          { label: 'En retard', value: 'overdue' as const },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={cn(
              "transition-all duration-200",
              filter === f.value && "shadow-md"
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Liste mobile */}
      {filteredInvoices.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="cursor-pointer active:scale-[0.98] transition-all duration-200"
              onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-semibold">{invoice.invoice_number}</span>
                  </div>
                  <Badge className={paymentStatusConfig[invoice.payment_status].className}>
                    {paymentStatusConfig[invoice.payment_status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{invoice.client_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{formatCurrency(invoice.total)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(invoice.issue_date)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tableau desktop */}
      {filteredInvoices.length > 0 && (
        <Card className="hidden md:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date émission</TableHead>
                <TableHead>Échéance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      {invoice.invoice_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.client_name}</TableCell>
                  <TableCell>
                    <Badge className={cn("transition-all duration-200 hover:scale-105", paymentStatusConfig[invoice.payment_status].className)}>
                      {paymentStatusConfig[invoice.payment_status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(invoice.total)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredInvoices.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucune facture trouvée</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || filter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre première facture pour un client'}
          </p>
          <Button onClick={() => router.push('/dashboard/invoices/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      )}

      <FloatingActionButton href="/dashboard/invoices/new" label="Nouvelle facture" />
    </LayoutContainer>
  )
}
