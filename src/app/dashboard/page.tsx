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
import { FileText, Users, CreditCard, Clock, Plus } from 'lucide-react';

// Mock data for KPIs
const kpis = {
  pendingSignatures: 5,
  signedThisMonth: 12,
  depositsThisMonth: 8450,
};

// Mock data for recent quotes
const recentQuotes = [
  {
    id: '1',
    quote_number: 'DEVIS-2024-00042',
    client_name: 'M. Martin',
    status: 'draft' as const,
    total_ttc: 2450.0,
    created_at: '2024-12-10',
  },
  {
    id: '2',
    quote_number: 'DEVIS-2024-00041',
    client_name: 'Mme Dubois',
    status: 'signed' as const,
    total_ttc: 1890.0,
    created_at: '2024-12-09',
  },
  {
    id: '3',
    quote_number: 'DEVIS-2024-00040',
    client_name: 'M. Bernard',
    status: 'deposit_paid' as const,
    total_ttc: 5200.0,
    created_at: '2024-12-08',
  },
  {
    id: '4',
    quote_number: 'DEVIS-2024-00039',
    client_name: 'Mme Laurent',
    status: 'sent' as const,
    total_ttc: 780.0,
    created_at: '2024-12-07',
  },
];

const statusConfig = {
  draft: { label: 'Brouillon', variant: 'secondary' as const },
  sent: { label: 'Envoyé', variant: 'outline' as const },
  signed: { label: 'Signé', variant: 'default' as const },
  deposit_paid: { label: 'Acompte payé', variant: 'default' as const },
  completed: { label: 'Terminé', variant: 'default' as const },
  canceled: { label: 'Annulé', variant: 'destructive' as const },
};

export default function DashboardPage() {
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

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Devis en attente de signature
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingSignatures}</div>
            <p className="text-muted-foreground text-xs">
              Envoyés et en attente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Devis signés ce mois
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.signedThisMonth}</div>
            <p className="text-muted-foreground text-xs">
              +3 par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Acomptes encaissés ce mois
            </CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(kpis.depositsThisMonth)}
            </div>
            <p className="text-muted-foreground text-xs">
              Sur {kpis.signedThisMonth} devis
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
                    <p className="font-medium">{quote.client_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {quote.quote_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(quote.total_ttc)}
                    </p>
                    <Badge variant={statusConfig[quote.status].variant}>
                      {statusConfig[quote.status].label}
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
                    <TableCell>{quote.client_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[quote.status].variant}>
                        {statusConfig[quote.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(quote.total_ttc)}
                    </TableCell>
                    <TableCell>
                      {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton href="/dashboard/quotes/new" label="Nouveau devis" />
    </LayoutContainer>
  );
}
