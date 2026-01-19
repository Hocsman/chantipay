'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutContainer } from '@/components/LayoutContainer';
import { PageHeader } from '@/components/PageHeader';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Users, CreditCard, Clock, Plus, Loader2, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quote {
  id: string
  quote_number: string
  status: 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'
  total_ttc: number
  created_at: string
  clients?: {
    name: string
  }
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
  signed: {
    label: 'Signé',
    className: 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/25'
  },
  deposit_paid: {
    label: 'Acompte payé',
    className: 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/25'
  },
  completed: {
    label: 'Terminé',
    className: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
  },
  canceled: {
    label: 'Annulé',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
  },
};

export default function DashboardPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Charger les devis
        const quotesRes = await fetch('/api/quotes')
        if (quotesRes.ok) {
          const data = await quotesRes.json()
          setQuotes(data.quotes || [])
        }

        // Charger les clients
        const clientsRes = await fetch('/api/clients')
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClientCount(data.clients?.length || 0)
        }
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calcul des KPIs
  const pendingSignatures = quotes.filter(q => q.status === 'sent' || q.status === 'draft').length
  const signedQuotes = quotes.filter(q =>
    q.status === 'signed' || q.status === 'deposit_paid' || q.status === 'completed'
  ).length
  const totalTTC = quotes.reduce((sum, q) => sum + (q.total_ttc || 0), 0)

  const recentQuotes = quotes.slice(0, 5)

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
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-xl p-5 border border-amber-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Devis en cours</p>
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{pendingSignatures}</p>
              <p className="text-xs text-muted-foreground mt-1">En attente de signature</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-5 border border-blue-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Clients</p>
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{clientCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Dans votre carnet</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-5 border border-green-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Devis signés</p>
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600">{signedQuotes}</p>
              <p className="text-xs text-muted-foreground mt-1">Sur {quotes.length} devis au total</p>
            </div>

            <div className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 rounded-xl p-5 border border-violet-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Montant total</p>
                <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-violet-600">{formatCurrency(totalTTC)}</p>
              <p className="text-xs text-muted-foreground mt-1">Tous devis confondus</p>
            </div>
          </div>

          {/* Quick Actions (Mobile) */}
          <div className="grid grid-cols-2 gap-4 md:hidden">
            <Link href="/dashboard/quotes/new">
              <Card className="hover:shadow-md cursor-pointer transition-all active:scale-[0.98]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">Nouveau devis</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/clients/new">
              <Card className="hover:shadow-md cursor-pointer transition-all active:scale-[0.98]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                    <Users className="text-blue-500 h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">Nouveau client</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Quotes */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-primary p-2">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                Derniers devis
              </CardTitle>
              <Link href="/dashboard/quotes">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucun devis pour le moment</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Créez votre premier devis pour commencer
                  </p>
                  <Button onClick={() => router.push('/dashboard/quotes/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer mon premier devis
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile List */}
                  <div className="divide-y md:hidden">
                    {recentQuotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/dashboard/quotes/${quote.id}`}
                        className="block p-4 hover:bg-muted/50 transition-colors active:bg-muted"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{quote.clients?.name || 'Client'}</p>
                              <p className="text-sm text-muted-foreground">{quote.quote_number}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(quote.total_ttc || 0)}</p>
                            <Badge className={cn("mt-1", statusConfig[quote.status]?.className)}>
                              {statusConfig[quote.status]?.label || quote.status}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block">
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
                        {recentQuotes.map((quote) => (
                          <TableRow
                            key={quote.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
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
                              <Badge className={cn("transition-all duration-200 hover:scale-105", statusConfig[quote.status]?.className)}>
                                {statusConfig[quote.status]?.label || quote.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(quote.total_ttc || 0)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(quote.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton href="/dashboard/quotes/new" label="Nouveau devis" />
    </LayoutContainer>
  );
}
