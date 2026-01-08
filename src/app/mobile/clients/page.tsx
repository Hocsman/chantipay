'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, ChevronRight, Loader2, Plus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at: string;
}

export default function MobileClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error('Erreur chargement clients:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadClients();
  }, []);

  // Filtrer les clients par recherche
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout title="Clients" subtitle="Gérez vos clients et prospects">
      <div className="p-4 space-y-4">
        {/* Bouton Nouveau Client */}
        <Button
          className="w-full h-12 text-base"
          onClick={() => router.push('/mobile/clients/new')}
        >
          <Plus className="mr-2 h-5 w-5" />
          Nouveau client
        </Button>

        {/* Barre de recherche */}
        {clients.length > 0 && (
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Rechercher un client..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Liste des clients */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/mobile/clients/${client.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{client.name}</p>
                    {client.city && (
                      <p className="text-muted-foreground text-sm">{client.city}</p>
                    )}
                    {client.phone && (
                      <p className="text-muted-foreground text-sm">{client.phone}</p>
                    )}
                    {client.email && (
                      <p className="text-muted-foreground text-xs">{client.email}</p>
                    )}
                  </div>
                  <ChevronRight className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClients.length === 0 && clients.length === 0 && (
          <EmptyState
            icon={Users}
            title="Aucun client !"
            description="Créez votre premier client pour commencer à générer des devis."
            variant="colorful"
          />
        )}

        {/* No search results */}
        {!isLoading &&
          filteredClients.length === 0 &&
          clients.length > 0 &&
          searchQuery && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aucun client ne correspond à votre recherche.
              </p>
            </div>
          )}
      </div>
    </MobileLayout>
  );
}
