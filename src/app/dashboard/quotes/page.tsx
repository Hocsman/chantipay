'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge'
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
import { Plus, Search, FileText, Loader2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
}

interface Quote {
  id: string
  quote_number: string
  status: QuoteStatus
  total_ttc: number
  created_at: string
  clients?: {
    name: string
  }
  items?: QuoteItem[]
}

const statusFilters: { label: string; value: QuoteStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Envoyé', value: 'sent' },
  { label: 'Signé', value: 'signed' },
  { label: 'Acompte payé', value: 'deposit_paid' },
  { label: 'Terminé', value: 'completed' },
  { label: 'Annulé', value: 'canceled' },
]

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  useEffect(() => {
    async function loadQuotes() {
      try {
        const response = await fetch('/api/quotes')
        if (response.ok) {
          const data = await response.json()
          setQuotes(data.quotes || [])
        }
      } catch (error) {
        console.error('Erreur chargement devis:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuotes()
  }, [])

  const filteredQuotes = quotes.filter((quote) => {
    const clientName = quote.clients?.name || ''
    const totalAmount = quote.total_ttc?.toString() || '0'

    // Recherche dans les descriptions des items (types de prestation)
    const itemsDescriptions = quote.items?.map(item => item.description.toLowerCase()).join(' ') || ''

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchLower) ||
      clientName.toLowerCase().includes(searchLower) ||
      totalAmount.includes(searchQuery) ||
      itemsDescriptions.includes(searchLower)

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
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

  // Calculer les statistiques rapides
  const stats = {
    total: quotes.length,
    signed: quotes.filter(q => q.status === 'signed').length,
    pending: quotes.filter(q => q.status === 'sent').length,
    totalAmount: quotes.reduce((sum, q) => sum + (q.total_ttc || 0), 0),
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Devis"
        description="Gérez tous vos devis clients"
        action={
          <Button
            onClick={() => router.push('/dashboard/quotes/new')}
            className="hidden sm:flex gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground">Total devis</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 border border-green-500/10">
          <p className="text-sm text-muted-foreground">Signés</p>
          <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 border border-blue-500/10">
          <p className="text-sm text-muted-foreground">En attente</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 rounded-xl p-4 border border-violet-500/10">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Montant total</p>
            <TrendingUp className="h-3 w-3 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-violet-600">{formatCurrency(stats.totalAmount)}</p>
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
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "transition-all duration-200",
              statusFilter === filter.value && "shadow-md"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des devis...</p>
        </div>
      )}

      {/* Liste des devis - Vue mobile */}
      {!isLoading && filteredQuotes.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredQuotes.map((quote, index) => (
            <Card
              key={quote.id}
              className="cursor-pointer active:scale-[0.98] transition-all duration-200"
              onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold">{quote.quote_number}</span>
                  </div>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{quote.clients?.name || 'Client'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">{formatCurrency(quote.total_ttc || 0)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Liste des devis - Vue desktop */}
      {!isLoading && filteredQuotes.length > 0 && (
        <Card className="hidden md:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote, index) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      {quote.quote_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{quote.clients?.name || 'Client'}</TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(quote.total_ttc || 0)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(quote.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!isLoading && filteredQuotes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun devis trouvé</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier devis pour un client'}
          </p>
          <Button onClick={() => router.push('/dashboard/quotes/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      )}

      <FloatingActionButton href="/dashboard/quotes/new" label="Nouveau devis" />
    </LayoutContainer>
  )
}
