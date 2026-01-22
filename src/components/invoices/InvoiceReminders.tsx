'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Clock, CheckCircle2, AlertCircle, Send, RefreshCw, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    nextReminderIn: number | null
    canRemind: boolean
}

interface ReminderStats {
    totalOverdue: number
    readyForReminder: number
    totalReminders: number
}

export function InvoiceReminders() {
    const [invoices, setInvoices] = useState<InvoiceForReminder[]>([])
    const [stats, setStats] = useState<ReminderStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())

    const loadReminders = useCallback(async () => {
        try {
            const response = await fetch('/api/invoices/reminders')
            if (response.ok) {
                const data = await response.json()
                setInvoices(data.invoices || [])
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Erreur chargement relances factures:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadReminders()
    }, [loadReminders])

    const toggleInvoiceSelection = (invoiceId: string) => {
        const newSelection = new Set(selectedInvoices)
        if (newSelection.has(invoiceId)) {
            newSelection.delete(invoiceId)
        } else {
            newSelection.add(invoiceId)
        }
        setSelectedInvoices(newSelection)
    }

    const selectAllDue = () => {
        const dueInvoices = invoices.filter(inv => inv.nextReminderDue && inv.canRemind)
        setSelectedInvoices(new Set(dueInvoices.map(inv => inv.id)))
    }

    const handleSendReminders = async () => {
        if (selectedInvoices.size === 0) {
            toast.error('Sélectionnez au moins une facture')
            return
        }

        setIsSending(true)
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
                loadReminders()
            } else {
                toast.error(data.error || 'Erreur lors de l\'envoi')
            }
        } catch (error) {
            console.error('Erreur envoi relances factures:', error)
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

    const dueCount = invoices.filter(inv => inv.nextReminderDue && inv.canRemind).length

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-red-500" />
                            Relances de factures
                        </CardTitle>
                        <CardDescription>
                            Envoyez des rappels pour vos factures impayées
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
                            <p className="text-2xl font-bold">{stats.totalOverdue}</p>
                            <p className="text-xs text-muted-foreground">En retard</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{stats.readyForReminder}</p>
                            <p className="text-xs text-muted-foreground">À relancer</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">{stats.totalReminders}</p>
                            <p className="text-xs text-muted-foreground">Relances envoyées</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {invoices.length > 0 && (
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
                            {selectedInvoices.size > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {selectedInvoices.size} sélectionné(s)
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={handleSendReminders}
                            disabled={selectedInvoices.size === 0 || isSending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Envoyer {selectedInvoices.size > 0 ? `(${selectedInvoices.size})` : ''}
                        </Button>
                    </div>
                )}

                {/* Liste des factures */}
                {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p>Aucune facture en retard de paiement</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                                    invoice.nextReminderDue && 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
                                    selectedInvoices.has(invoice.id) && 'ring-2 ring-primary',
                                    !invoice.canRemind && 'opacity-60'
                                )}
                            >
                                <Checkbox
                                    checked={selectedInvoices.has(invoice.id)}
                                    onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                                    disabled={!invoice.canRemind}
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{invoice.invoice_number}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-muted-foreground truncate">
                                            {invoice.client_name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-red-600 font-medium">
                                            {invoice.daysPastDue} jour(s) de retard
                                        </span>
                                        <span>•</span>
                                        <span>{formatCurrency(invoice.total_ttc)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {invoice.reminderCount > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            {invoice.reminderCount} relance(s)
                                        </Badge>
                                    )}
                                    {invoice.nextReminderDue ? (
                                        <Badge className="bg-red-500 text-white">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            À relancer
                                        </Badge>
                                    ) : invoice.nextReminderIn ? (
                                        <Badge variant="outline" className="text-xs">
                                            Dans {invoice.nextReminderIn}j
                                        </Badge>
                                    ) : !invoice.canRemind ? (
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
