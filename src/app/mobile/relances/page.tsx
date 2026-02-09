'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Bell,
  FileText,
  Receipt,
  Settings,
  Loader2,
  AlertCircle,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
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
  canRemind: boolean
}

interface InvoiceForReminder {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  total_ttc: number
  due_date: string
  daysPastDue: number
  reminderCount: number
  nextReminderDue: boolean
  canRemind: boolean
}

interface UnifiedReminderStats {
  quotes: {
    totalPending: number
    readyForReminder: number
    totalReminders: number
  }
  invoices: {
    totalOverdue: number
    readyForReminder: number
    totalReminders: number
  }
}

export default function MobileRelancesPage() {
  const [activeTab, setActiveTab] = useState<'devis' | 'factures'>('devis')
  const [stats, setStats] = useState<UnifiedReminderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Quotes state
  const [quotes, setQuotes] = useState<QuoteForReminder[]>([])
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set())
  const [isSendingQuotes, setIsSendingQuotes] = useState(false)

  // Invoices state
  const [invoices, setInvoices] = useState<InvoiceForReminder[]>([])
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const [isSendingInvoices, setIsSendingInvoices] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [quotesRes, invoicesRes] = await Promise.all([
        fetch('/api/quotes/reminders'),
        fetch('/api/invoices/reminders'),
      ])

      if (quotesRes.ok) {
        const data = await quotesRes.json()
        setQuotes(data.quotes || [])
        setStats(prev => ({
          ...prev,
          quotes: data.stats || { totalPending: 0, readyForReminder: 0, totalReminders: 0 },
          invoices: prev?.invoices || { totalOverdue: 0, readyForReminder: 0, totalReminders: 0 },
        }))
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(data.invoices || [])
        setStats(prev => ({
          ...prev,
          quotes: prev?.quotes || { totalPending: 0, readyForReminder: 0, totalReminders: 0 },
          invoices: data.stats || { totalOverdue: 0, readyForReminder: 0, totalReminders: 0 },
        }))
      }
    } catch (error) {
      console.error('Erreur chargement relances:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Quote handlers
  const toggleQuoteSelection = (id: string) => {
    const newSelection = new Set(selectedQuotes)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedQuotes(newSelection)
  }

  const selectAllDueQuotes = () => {
    const dueQuotes = quotes.filter(q => q.nextReminderDue && q.canRemind)
    setSelectedQuotes(new Set(dueQuotes.map(q => q.id)))
  }

  const handleSendQuoteReminders = async () => {
    if (selectedQuotes.size === 0) return
    setIsSendingQuotes(true)
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
        loadData()
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsSendingQuotes(false)
    }
  }

  // Invoice handlers
  const toggleInvoiceSelection = (id: string) => {
    const newSelection = new Set(selectedInvoices)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedInvoices(newSelection)
  }

  const selectAllDueInvoices = () => {
    const dueInvoices = invoices.filter(inv => inv.nextReminderDue && inv.canRemind)
    setSelectedInvoices(new Set(dueInvoices.map(inv => inv.id)))
  }

  const handleSendInvoiceReminders = async () => {
    if (selectedInvoices.size === 0) return
    setIsSendingInvoices(true)
    try {
      const response = await fetch('/api/invoices/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: Array.from(selectedInvoices) }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(data.message)
        setSelectedInvoices(new Set())
        loadData()
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setIsSendingInvoices(false)
    }
  }

  const totalReadyForReminder = stats
    ? stats.quotes.readyForReminder + stats.invoices.readyForReminder
    : 0

  const dueQuotesCount = quotes.filter(q => q.nextReminderDue && q.canRemind).length
  const dueInvoicesCount = invoices.filter(inv => inv.nextReminderDue && inv.canRemind).length

  if (isLoading) {
    return (
      <MobileLayout title="Relances" showBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des relances...</p>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Relances" showBottomNav={false}>
      <div className="p-4 space-y-4">
        {/* Header avec paramètres */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Relances</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link href="/mobile/relances/parametres">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/10">
            <CardContent className="p-3 text-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-600">{totalReadyForReminder}</p>
              <p className="text-xs text-muted-foreground">À relancer</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/10">
            <CardContent className="p-3 text-center">
              <FileText className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-600">{stats?.quotes.totalPending || 0}</p>
              <p className="text-xs text-muted-foreground">Devis</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/10">
            <CardContent className="p-3 text-center">
              <Receipt className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-600">{stats?.invoices.totalOverdue || 0}</p>
              <p className="text-xs text-muted-foreground">Factures</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'devis' ? 'default' : 'outline'}
            onClick={() => setActiveTab('devis')}
            className="flex-1 gap-2"
          >
            <FileText className="h-4 w-4" />
            Devis
            {stats && stats.quotes.readyForReminder > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
                {stats.quotes.readyForReminder}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'factures' ? 'default' : 'outline'}
            onClick={() => setActiveTab('factures')}
            className="flex-1 gap-2"
          >
            <Receipt className="h-4 w-4" />
            Factures
            {stats && stats.invoices.readyForReminder > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">
                {stats.invoices.readyForReminder}
              </Badge>
            )}
          </Button>
        </div>

        {/* Contenu Devis */}
        {activeTab === 'devis' && (
          <div className="space-y-3">
            {quotes.length > 0 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllDueQuotes}
                  disabled={dueQuotesCount === 0}
                >
                  Sélectionner ({dueQuotesCount})
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendQuoteReminders}
                  disabled={selectedQuotes.size === 0 || isSendingQuotes}
                >
                  {isSendingQuotes ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Envoyer ({selectedQuotes.size})
                    </>
                  )}
                </Button>
              </div>
            )}

            {quotes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-muted-foreground">Aucun devis en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {quotes.map((quote) => (
                  <Card
                    key={quote.id}
                    className={cn(
                      'transition-all',
                      quote.nextReminderDue && 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20',
                      selectedQuotes.has(quote.id) && 'ring-2 ring-primary',
                      !quote.canRemind && 'opacity-60'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedQuotes.has(quote.id)}
                          onCheckedChange={() => toggleQuoteSelection(quote.id)}
                          disabled={!quote.canRemind}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{quote.quote_number}</span>
                            {quote.nextReminderDue && (
                              <Badge className="bg-amber-500 text-white text-xs">
                                À relancer
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.client_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{quote.daysSinceSent}j</span>
                            <span>•</span>
                            <span>{formatCurrency(quote.total_ttc)}</span>
                            {quote.reminderCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{quote.reminderCount} relance(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contenu Factures */}
        {activeTab === 'factures' && (
          <div className="space-y-3">
            {invoices.length > 0 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllDueInvoices}
                  disabled={dueInvoicesCount === 0}
                >
                  Sélectionner ({dueInvoicesCount})
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleSendInvoiceReminders}
                  disabled={selectedInvoices.size === 0 || isSendingInvoices}
                >
                  {isSendingInvoices ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Envoyer ({selectedInvoices.size})
                    </>
                  )}
                </Button>
              </div>
            )}

            {invoices.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-muted-foreground">Aucune facture en retard</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <Card
                    key={invoice.id}
                    className={cn(
                      'transition-all',
                      invoice.nextReminderDue && 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
                      selectedInvoices.has(invoice.id) && 'ring-2 ring-primary',
                      !invoice.canRemind && 'opacity-60'
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                          disabled={!invoice.canRemind}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            {invoice.nextReminderDue && (
                              <Badge className="bg-red-500 text-white text-xs">
                                À relancer
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {invoice.client_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-red-600 font-medium">
                              {invoice.daysPastDue}j de retard
                            </span>
                            <span>•</span>
                            <span>{formatCurrency(invoice.total_ttc)}</span>
                            {invoice.reminderCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{invoice.reminderCount} relance(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </MobileLayout>
  )
}
