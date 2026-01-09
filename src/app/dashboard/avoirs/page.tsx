'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  finalized: { label: 'Finalisé', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
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
    // Filtrage par statut
    const matchesStatus = filter === 'all' || creditNote.status === filter
    
    // Recherche étendue
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

  const totalCreditAmount = creditNotes
    .filter(cn => cn.status === 'finalized')
    .reduce((sum, cn) => sum + Math.abs(cn.total), 0)

  const pendingAmount = creditNotes
    .filter(cn => cn.status === 'sent')
    .reduce((sum, cn) => sum + Math.abs(cn.total), 0)

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Avoirs" description="Gérez vos avoirs clients" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader title="Avoirs" description="Gérez vos avoirs clients" />

      {/* Bouton création desktop */}
      <div className="hidden md:flex justify-end mb-6">
        <Button onClick={() => router.push('/dashboard/avoirs/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel avoir
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Finalisés</p>
                <p className="text-2xl font-bold">-{totalCreditAmount.toFixed(2)} €</p>
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
                <p className="text-2xl font-bold">-{pendingAmount.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, montant, prestation ou raison..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tous ({creditNotes.length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Brouillons ({creditNotes.filter(cn => cn.status === 'draft').length})
        </Button>
        <Button
          variant={filter === 'sent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('sent')}
        >
          Envoyés ({creditNotes.filter(cn => cn.status === 'sent').length})
        </Button>
        <Button
          variant={filter === 'finalized' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('finalized')}
        >
          Finalisés ({creditNotes.filter(cn => cn.status === 'finalized').length})
        </Button>
      </div>

      {/* Liste des avoirs */}
      {filteredCreditNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun avoir</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {filter === 'all'
                ? "Créez votre premier avoir pour créditer vos clients."
                : `Aucun avoir avec le statut "${statusConfig[filter as keyof typeof statusConfig]?.label}"`
              }
            </p>
            <Button onClick={() => router.push('/dashboard/avoirs/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un avoir
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCreditNotes.map((creditNote) => (
            <Card
              key={creditNote.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/avoirs/${creditNote.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <h3 className="font-semibold text-base">{creditNote.credit_note_number}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{creditNote.client_name}</p>
                    {creditNote.reason && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Raison : {creditNote.reason}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap',
                    statusConfig[creditNote.status].color
                  )}>
                    {statusConfig[creditNote.status].label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Émis le {new Date(creditNote.issue_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="font-bold text-lg text-red-600">
                    -{Math.abs(creditNote.total).toFixed(2)} €
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB pour mobile */}
      <FloatingActionButton href="/dashboard/avoirs/new" label="Nouvel avoir" />
    </LayoutContainer>
  )
}
