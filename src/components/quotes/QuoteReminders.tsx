'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Clock, CheckCircle2, AlertCircle, Send, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuoteForReminder {
  id: string
  quote_number: string
  client_name: string
  client_email: string
  total_ttc: number
  sent_at: string
  daysSinceSent: number
  reminderCount: number
  nextReminderDue: boolean
  nextReminderIn: number | null
  canRemind: boolean
}

interface ReminderStats {
  totalPending: number
  readyForReminder: number
  totalReminders: number
}

export function QuoteReminders() {
  const [quotes, setQuotes] = useState<QuoteForReminder[]>([])
  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())

  const loadReminders = useCallback(async () => {
    try {
      const response = await fetch('/api/quotes/reminders')
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.quotes || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur chargement relances:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const toggleQuoteSelection = (quoteId: string) => {
    const newSelection = new Set(selectedQuotes)
    if (newSelection.has(quoteId)) {
      newSelection.delete(quoteId)
    } else {
      newSelection.add(quoteId)
    }
    setSelectedQuotes(newSelection)
  }

  const selectAllDue = () => {
    const dueQuotes = quotes.filter(q => q.nextReminderDue && q.canRemind)
    setSelectedQuotes(new Set(dueQuotes.map(q => q.id)))
  }

  const handleSendReminders = async () => {
    if (selectedQuotes.size === 0) {
      toast.error('Sélectionnez au moins un devis')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/quotes/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteIds: Array.from(selectedQuotes) }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setSelectedQuotes(new Set())
        loadReminders()
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Erreur envoi relances:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsSending(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const dueCount = quotes.filter(q => q.nextReminderDue && q.canRemind).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Relances de devis
            </CardTitle>
            <CardDescription>
              Envoyez des rappels pour vos devis en attente de signature
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={loadReminders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold">{stats.totalPending}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{stats.readyForReminder}</p>
              <p className="text-xs text-muted-foreground">À relancer</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.totalReminders}</p>
              <p className="text-xs text-muted-foreground">Relances envoyées</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {quotes.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllDue}
                disabled={dueCount === 0}
              >
                Sélectionner les {dueCount} à relancer
              </Button>
              {selectedQuotes.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedQuotes.size} sélectionné(s)
                </span>
              )}
            </div>
            <Button
              onClick={handleSendReminders}
              disabled={selectedQuotes.size === 0 || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer {selectedQuotes.size > 0 ? `(${selectedQuotes.size})` : ''}
            </Button>
          </div>
        )}

        {/* Liste des devis */}
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>Aucun devis en attente de signature</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  quote.nextReminderDue && 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
                  selectedQuotes.has(quote.id) && 'ring-2 ring-primary',
                  !quote.canRemind && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={selectedQuotes.has(quote.id)}
                  onCheckedChange={() => toggleQuoteSelection(quote.id)}
                  disabled={!quote.canRemind}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{quote.quote_number}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground truncate">
                      {quote.client_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Envoyé il y a {quote.daysSinceSent} jour(s)</span>
                    <span>•</span>
                    <span>{formatCurrency(quote.total_ttc)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {quote.reminderCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {quote.reminderCount} relance(s)
                    </Badge>
                  )}
                  {quote.nextReminderDue ? (
                    <Badge className="bg-amber-500 text-white">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      À relancer
                    </Badge>
                  ) : quote.nextReminderIn ? (
                    <Badge variant="outline" className="text-xs">
                      Dans {quote.nextReminderIn}j
                    </Badge>
                  ) : !quote.canRemind ? (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Max atteint
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
