'use client'

import { useState } from 'react'
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
import { Plus, Search, FileText } from 'lucide-react'

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

// Données de démonstration
const mockQuotes = [
  {
    id: '1',
    quote_number: 'DEV-2024-001',
    client_name: 'Jean Dupont',
    status: 'signed' as QuoteStatus,
    total_ttc: 1250.00,
    created_at: '2024-01-15',
  },
  {
    id: '2',
    quote_number: 'DEV-2024-002',
    client_name: 'Marie Martin',
    status: 'draft' as QuoteStatus,
    total_ttc: 890.50,
    created_at: '2024-01-18',
  },
  {
    id: '3',
    quote_number: 'DEV-2024-003',
    client_name: 'Pierre Bernard',
    status: 'deposit_paid' as QuoteStatus,
    total_ttc: 3200.00,
    created_at: '2024-01-20',
  },
  {
    id: '4',
    quote_number: 'DEV-2024-004',
    client_name: 'Sophie Leroy',
    status: 'sent' as QuoteStatus,
    total_ttc: 1580.00,
    created_at: '2024-01-22',
  },
  {
    id: '5',
    quote_number: 'DEV-2024-005',
    client_name: 'Lucas Moreau',
    status: 'completed' as QuoteStatus,
    total_ttc: 4500.00,
    created_at: '2024-01-10',
  },
]

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  const filteredQuotes = mockQuotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase())
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

      {/* Liste des devis - Vue mobile */}
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
              <p className="text-sm text-muted-foreground mb-2">{quote.client_name}</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{formatCurrency(quote.total_ttc)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des devis - Vue desktop */}
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
                <TableCell>{quote.client_name}</TableCell>
                <TableCell>
                  <QuoteStatusBadge status={quote.status} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(quote.total_ttc)}</TableCell>
                <TableCell>{formatDate(quote.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredQuotes.length === 0 && (
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
