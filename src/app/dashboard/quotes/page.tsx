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
import { Plus, Search, FileText, Loader2 } from 'lucide-react'

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

interface Quote {
  id: string
  quote_number: string
  status: QuoteStatus
  total_ttc: number
  created_at: string
  clients?: {
    name: string
  }
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
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <LayoutContainer>
      <PageHeader
        title="Devis"
        description="Gérez tous vos devis"
        action={
          <Button onClick={() => router.push('/dashboard/quotes/new')} className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        }
      />

      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Liste des devis - Vue mobile */}
      {!isLoading && filteredQuotes.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredQuotes.map((quote) => (
            <Card
              key={quote.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{quote.quote_number}</span>
                  </div>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-2">{quote.clients?.name || 'Client'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{formatCurrency(quote.total_ttc || 0)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Liste des devis - Vue desktop */}
      {!isLoading && filteredQuotes.length > 0 && (
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
                >
                  <TableCell className="font-medium">{quote.quote_number}</TableCell>
                  <TableCell>{quote.clients?.name || 'Client'}</TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={quote.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(quote.total_ttc || 0)}</TableCell>
                  <TableCell>{formatDate(quote.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!isLoading && filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun devis trouvé</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier devis'}
          </p>
          <Button onClick={() => router.push('/dashboard/quotes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>
      )}

      <FloatingActionButton href="/dashboard/quotes/new" label="Nouveau devis" />
    </LayoutContainer>
  )
}
