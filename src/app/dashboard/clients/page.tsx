'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

interface Client {
  id: string
  name: string
  city?: string | null
  phone?: string | null
  email?: string | null
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error('Erreur chargement clients:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadClients()
  }, [])

  // Filtrer les clients par recherche
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Mobile List */}
      {!isLoading && filteredClients.length > 0 && (
      <div className="space-y-3 md:hidden">
        {filteredClients.map((client) => (
          <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-muted-foreground text-sm">{client.city || 'Pas de ville'}</p>
                  {client.phone && (
                    <p className="text-muted-foreground text-xs">{client.phone}</p>
                  )}
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      )}

      {/* Desktop Table */}
      {!isLoading && filteredClients.length > 0 && (
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.city || '-'}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell>{client.email || '-'}</TableCell>
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
      )}

      {/* Empty State */}
      {!isLoading && filteredClients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4 text-center">
              {clients.length === 0 
                ? "Vous n'avez pas encore de clients."
                : "Aucun client ne correspond à votre recherche."
              }
            </p>
            {clients.length === 0 && (
              <Link href="/dashboard/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un client
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton href="/dashboard/clients/new" label="Nouveau client" />
    </LayoutContainer>
  );
}
