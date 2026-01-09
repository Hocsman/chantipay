'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { FloatingActionButton } from '@/components/FloatingActionButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, FileText, TrendingDown, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/mobile/EmptyState'

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

export default function MobileCreditNotesPage() {
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
      <MobileAppShell title="Avoirs" subtitle="Gérez vos avoirs">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title="Avoirs"
      subtitle="Gérez vos avoirs"
    >
      <div className="p-4 space-y-4">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500 rounded">
                  <TrendingDown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Finalisés</p>
                  <p className="text-lg font-bold">-{totalCreditAmount.toFixed(0)} €</p>
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
                  <p className="text-lg font-bold">-{pendingAmount.toFixed(0)} €</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, raison..."
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
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title="Aucun avoir"
              description={
                filter === 'all'
                  ? "Créez votre premier avoir pour créditer vos clients."
                  : `Aucun avoir avec le statut "${statusConfig[filter as keyof typeof statusConfig]?.label}"`
              }
            />
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push('/mobile/avoirs/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un avoir
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCreditNotes.map((creditNote) => (
              <Card
                key={creditNote.id}
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/mobile/avoirs/${creditNote.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <h3 className="font-semibold text-sm">{creditNote.credit_note_number}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{creditNote.client_name}</p>
                      {creditNote.reason && (
                        <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                          {creditNote.reason}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2',
                      statusConfig[creditNote.status].color
                    )}>
                      {statusConfig[creditNote.status].label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(creditNote.issue_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="font-bold text-base text-red-600">
                      -{Math.abs(creditNote.total).toFixed(2)} €
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <FloatingActionButton href="/mobile/avoirs/new" label="Nouvel avoir" />
    </MobileAppShell>
  )
}
