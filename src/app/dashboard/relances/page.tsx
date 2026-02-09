'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  FileText,
  Receipt,
  Settings,
  Loader2,
  AlertCircle,
  Mail,
  TrendingUp,
} from 'lucide-react'
import { QuoteReminders } from '@/components/quotes/QuoteReminders'
import { InvoiceReminders } from '@/components/invoices/InvoiceReminders'

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

export default function RelancesPage() {
  const [stats, setStats] = useState<UnifiedReminderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('devis')

  const loadStats = useCallback(async () => {
    try {
      const [quotesRes, invoicesRes] = await Promise.all([
        fetch('/api/quotes/reminders'),
        fetch('/api/invoices/reminders'),
      ])

      const quotesData = quotesRes.ok ? await quotesRes.json() : null
      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : null

      setStats({
        quotes: quotesData?.stats || {
          totalPending: 0,
          readyForReminder: 0,
          totalReminders: 0,
        },
        invoices: invoicesData?.stats || {
          totalOverdue: 0,
          readyForReminder: 0,
          totalReminders: 0,
        },
      })
    } catch (error) {
      console.error('Erreur chargement stats relances:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const totalReadyForReminder = stats
    ? stats.quotes.readyForReminder + stats.invoices.readyForReminder
    : 0

  const totalReminders = stats
    ? stats.quotes.totalReminders + stats.invoices.totalReminders
    : 0

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader
          title="Relances"
          description="Gérez vos relances de devis et factures"
        />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des relances...</p>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Relances"
        description="Gérez vos relances de devis et factures"
        action={
          <Link href="/dashboard/relances/parametres">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </Button>
          </Link>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">À relancer</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {totalReadyForReminder}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Devis en attente</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.quotes.totalPending || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Factures en retard</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {stats?.invoices.totalOverdue || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Relances envoyées</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalReminders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="devis" className="gap-2">
            <FileText className="h-4 w-4" />
            Devis
            {stats && stats.quotes.readyForReminder > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              >
                {stats.quotes.readyForReminder}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="factures" className="gap-2">
            <Receipt className="h-4 w-4" />
            Factures
            {stats && stats.invoices.readyForReminder > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
              >
                {stats.invoices.readyForReminder}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devis" className="mt-4">
          <QuoteReminders />
        </TabsContent>

        <TabsContent value="factures" className="mt-4">
          <InvoiceReminders />
        </TabsContent>
      </Tabs>

      {/* Info automatisation */}
      <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">
                Relances automatiques
              </h3>
              <p className="text-sm text-muted-foreground">
                Configurez vos intervalles de relance dans les paramètres. Les
                relances automatiques seront disponibles prochainement.
              </p>
              <Link href="/dashboard/relances/parametres">
                <Button variant="link" className="h-auto p-0 mt-2 text-violet-600">
                  Configurer les paramètres →
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </LayoutContainer>
  )
}
