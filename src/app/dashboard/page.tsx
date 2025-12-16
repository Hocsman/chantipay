'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link';
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
import { FileText, Users, CreditCard, Clock, Plus, Loader2 } from 'lucide-react';

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
  draft: { label: 'Brouillon', variant: 'secondary' as const },
  sent: { label: 'Envoyé', variant: 'outline' as const },
  signed: { label: 'Signé', variant: 'default' as const },
  deposit_paid: { label: 'Acompte payé', variant: 'default' as const },
  completed: { label: 'Terminé', variant: 'default' as const },
  canceled: { label: 'Annulé', variant: 'destructive' as const },
};

export default function DashboardPage() {
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

  return (
    <LayoutContainer>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
      >
        <Link href="/dashboard/quotes/new" className="hidden md:block">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Devis en cours
                </CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingSignatures}</div>
                <p className="text-muted-foreground text-xs">
                  En attente de signature
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Clients
                </CardTitle>
                <Users className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientCount}</div>
                <p className="text-muted-foreground text-xs">
                  Dans votre carnet
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Devis signés
                </CardTitle>
                <CreditCard className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{signedQuotes}</div>
                <p className="text-muted-foreground text-xs">
                  Sur {quotes.length} devis au total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions (Mobile) */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:hidden">
            <Link href="/dashboard/quotes/new">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileText className="text-primary mb-2 h-8 w-8" />
                  <span className="text-sm font-medium">Nouveau devis</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/clients/new">
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <Users className="text-primary mb-2 h-8 w-8" />
                  <span className="text-sm font-medium">Nouveau client</span>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Quotes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Derniers devis</CardTitle>
              <Link href="/dashboard/quotes">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentQuotes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun devis pour le moment</p>
                  <Link href="/dashboard/quotes/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer mon premier devis
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile List */}
                  <div className="space-y-4 md:hidden">
                    {recentQuotes.map((quote) => (
                      <Link
                        key={quote.id}
                        href={`/dashboard/quotes/${quote.id}`}
                        className="block"
                      >
                        <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                          <div>
                            <p className="font-medium">{quote.clients?.name || 'Client'}</p>
                            <p className="text-muted-foreground text-sm">
                              {quote.quote_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(quote.total_ttc || 0)}
                            </p>
                            <Badge variant={statusConfig[quote.status]?.variant || 'secondary'}>
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
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Total TTC</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentQuotes.map((quote) => (
                          <TableRow key={quote.id}>
                            <TableCell>
                              <Link
                                href={`/dashboard/quotes/${quote.id}`}
                                className="text-primary hover:underline"
                              >
                                {quote.quote_number}
                              </Link>
                            </TableCell>
                            <TableCell>{quote.clients?.name || 'Client'}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[quote.status]?.variant || 'secondary'}>
                                {statusConfig[quote.status]?.label || quote.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(quote.total_ttc || 0)}
                            </TableCell>
                            <TableCell>
                              {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
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
