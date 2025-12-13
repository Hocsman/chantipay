import Link from 'next/link';
import { LayoutContainer } from '@/components/LayoutContainer';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Phone, MapPin, Plus, FileText } from 'lucide-react';

// Mock data for client
const client = {
  id: '1',
  name: 'M. Jean Martin',
  email: 'jean.martin@email.com',
  phone: '06 12 34 56 78',
  address_line1: '123 rue de la République',
  postal_code: '75001',
  city: 'Paris',
  notes: 'Client régulier, préfère les rendez-vous le matin.',
  created_at: '2024-01-15',
};

// Mock data for client quotes
const clientQuotes = [
  {
    id: '1',
    quote_number: 'DEVIS-2024-00042',
    status: 'draft' as const,
    total_ttc: 2450.0,
    created_at: '2024-12-10',
  },
  {
    id: '2',
    quote_number: 'DEVIS-2024-00035',
    status: 'deposit_paid' as const,
    total_ttc: 3200.0,
    created_at: '2024-11-28',
  },
  {
    id: '3',
    quote_number: 'DEVIS-2024-00020',
    status: 'completed' as const,
    total_ttc: 1890.0,
    created_at: '2024-10-15',
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

export default function ClientDetailPage() {
  return (
    <LayoutContainer>
      <div className="mb-4">
        <Link
          href="/dashboard/clients"
          className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux clients
        </Link>
      </div>

      <PageHeader title={client.name} description={`Client depuis le ${new Date(client.created_at).toLocaleDateString('fr-FR')}`}>
        <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Créer un devis
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary text-sm hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-primary text-sm hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {(client.address_line1 || client.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-muted-foreground text-sm">
                      {client.address_line1}
                      {client.address_line1 && <br />}
                      {client.postal_code} {client.city}
                    </p>
                  </div>
                </div>
              )}
              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-sm font-medium">Notes</p>
                    <p className="text-muted-foreground text-sm">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quotes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Devis</CardTitle>
              <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau devis
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {clientQuotes.length > 0 ? (
                <div className="space-y-4">
                  {clientQuotes.map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/dashboard/quotes/${quote.id}`}
                      className="block"
                    >
                      <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="text-muted-foreground h-5 w-5" />
                          <div>
                            <p className="font-medium">{quote.quote_number}</p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
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
              ) : (
                <div className="py-8 text-center">
                  <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground mb-4">
                    Aucun devis pour ce client
                  </p>
                  <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un devis
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutContainer>
  );
}
