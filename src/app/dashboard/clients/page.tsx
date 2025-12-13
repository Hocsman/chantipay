import Link from 'next/link';
import { LayoutContainer } from '@/components/LayoutContainer';
import { PageHeader } from '@/components/PageHeader';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, ChevronRight } from 'lucide-react';

// Mock data for clients
const clients = [
  {
    id: '1',
    name: 'M. Jean Martin',
    city: 'Paris',
    phone: '06 12 34 56 78',
    email: 'jean.martin@email.com',
    last_quote_date: '2024-12-10',
  },
  {
    id: '2',
    name: 'Mme Sophie Dubois',
    city: 'Lyon',
    phone: '06 98 76 54 32',
    email: 'sophie.dubois@email.com',
    last_quote_date: '2024-12-05',
  },
  {
    id: '3',
    name: 'M. Pierre Bernard',
    city: 'Marseille',
    phone: '06 11 22 33 44',
    email: 'p.bernard@email.com',
    last_quote_date: '2024-11-28',
  },
  {
    id: '4',
    name: 'Mme Marie Laurent',
    city: 'Toulouse',
    phone: '06 55 66 77 88',
    email: 'marie.laurent@email.com',
    last_quote_date: '2024-11-20',
  },
  {
    id: '5',
    name: 'M. Thomas Moreau',
    city: 'Bordeaux',
    phone: '06 99 88 77 66',
    email: 'thomas.moreau@email.com',
    last_quote_date: null,
  },
];

export default function ClientsPage() {
  return (
    <LayoutContainer>
      <PageHeader
        title="Clients"
        description="Gérez vos clients et leurs informations"
      >
        <Link href="/dashboard/clients/new" className="hidden md:block">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Button>
        </Link>
      </PageHeader>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Rechercher un client..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile List */}
      <div className="space-y-3 md:hidden">
        {clients.map((client) => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-muted-foreground text-sm">{client.city}</p>
                  {client.last_quote_date && (
                    <p className="text-muted-foreground text-xs">
                      Dernier devis:{' '}
                      {new Date(client.last_quote_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dernier devis</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.city}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    {client.last_quote_date
                      ? new Date(client.last_quote_date).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/clients/${client.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Empty State */}
      {clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              Vous n&apos;avez pas encore de clients.
            </p>
            <Link href="/dashboard/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton href="/dashboard/clients/new" label="Nouveau client" />
    </LayoutContainer>
  );
}
