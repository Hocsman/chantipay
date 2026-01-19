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
import { Loader2, Plus, FileText, TrendingDown, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreditNoteItem {
  id: string
  description: string
  quantity: number
  unit_price: number
}

interface CreditNote {
  id: string
  credit_note_number: string
  client_name: string
  issue_date: string
  total: number
  status: 'draft' | 'sent' | 'finalized'
  reason?: string
  items?: CreditNoteItem[]
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
  sent: {
    label: 'Envoyé',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
  },
  finalized: {
    label: 'Finalisé',
    className: 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/25'
  },
}

type FilterStatus = 'all' | 'draft' | 'sent' | 'finalized'

export default function CreditNotesPage() {
  const router = useRouter()
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCreditNotes()
  }, [])

  const loadCreditNotes = async () => {
    try {
      const response = await fetch('/api/credit-notes')
      if (!response.ok) throw new Error('Erreur lors du chargement')
      const data = await response.json()
      setCreditNotes(data.creditNotes)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des avoirs')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCreditNotes = creditNotes.filter(creditNote => {
    const matchesStatus = filter === 'all' || creditNote.status === filter

    if (!searchQuery) return matchesStatus

    const searchLower = searchQuery.toLowerCase()
    const totalAmount = Math.abs(creditNote.total)?.toString() || '0'
    const itemsDescriptions = creditNote.items?.map(item => item.description.toLowerCase()).join(' ') || ''

    const matchesSearch =
      creditNote.credit_note_number.toLowerCase().includes(searchLower) ||
      creditNote.client_name.toLowerCase().includes(searchLower) ||
      totalAmount.includes(searchQuery) ||
      itemsDescriptions.includes(searchLower) ||
      (creditNote.reason && creditNote.reason.toLowerCase().includes(searchLower))

    return matchesStatus && matchesSearch
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount))
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
    total: creditNotes.length,
    finalized: creditNotes.filter(cn => cn.status === 'finalized').length,
    pending: creditNotes.filter(cn => cn.status === 'sent').length,
    draft: creditNotes.filter(cn => cn.status === 'draft').length,
    totalFinalized: creditNotes.filter(cn => cn.status === 'finalized').reduce((sum, cn) => sum + Math.abs(cn.total), 0),
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Avoirs" description="Gérez vos avoirs clients" />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des avoirs...</p>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Avoirs"
        description="Gérez vos avoirs clients"
        action={
          <Button
            onClick={() => router.push('/dashboard/avoirs/new')}
            className="hidden sm:flex gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Nouvel avoir
          </Button>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground">Total avoirs</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 border border-green-500/10">
          <p className="text-sm text-muted-foreground">Finalisés</p>
          <p className="text-2xl font-bold text-green-600">{stats.finalized}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 border border-blue-500/10">
          <p className="text-sm text-muted-foreground">Envoyés</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/5 to-red-500/10 rounded-xl p-4 border border-red-500/10">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Montant total</p>
            <TrendingDown className="h-3 w-3 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">-{formatCurrency(stats.totalFinalized)}</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, client, montant ou raison..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12"
        />
      </div>

      {/* Filtres par statut */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Tous', value: 'all' as const },
          { label: 'Brouillons', value: 'draft' as const },
          { label: 'Envoyés', value: 'sent' as const },
          { label: 'Finalisés', value: 'finalized' as const },
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
      {filteredCreditNotes.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredCreditNotes.map((creditNote) => (
            <Card
              key={creditNote.id}
              className="cursor-pointer active:scale-[0.98] transition-all duration-200"
              onClick={() => router.push(`/dashboard/avoirs/${creditNote.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="font-semibold">{creditNote.credit_note_number}</span>
                  </div>
                  <Badge className={statusConfig[creditNote.status].className}>
                    {statusConfig[creditNote.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{creditNote.client_name}</p>
                {creditNote.reason && (
                  <p className="text-xs text-muted-foreground italic mb-3">Raison : {creditNote.reason}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-red-600">-{formatCurrency(creditNote.total)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(creditNote.issue_date)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tableau desktop */}
      {filteredCreditNotes.length > 0 && (
        <Card className="hidden md:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date émission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreditNotes.map((creditNote) => (
                <TableRow
                  key={creditNote.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/dashboard/avoirs/${creditNote.id}`)}
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/5 group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>
                      {creditNote.credit_note_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{creditNote.client_name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {creditNote.reason || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("transition-all duration-200 hover:scale-105", statusConfig[creditNote.status].className)}>
                      {statusConfig[creditNote.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    -{formatCurrency(creditNote.total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(creditNote.issue_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {filteredCreditNotes.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun avoir trouvé</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || filter !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier avoir pour un client'}
          </p>
          <Button onClick={() => router.push('/dashboard/avoirs/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel avoir
          </Button>
        </div>
      )}

      <FloatingActionButton href="/dashboard/avoirs/new" label="Nouvel avoir" />
    </LayoutContainer>
  )
}
