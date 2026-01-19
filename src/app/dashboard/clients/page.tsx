'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
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
import { Plus, Search, Users, Loader2, Mail, Phone, MapPin, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string
  name: string
  city?: string | null
  phone?: string | null
  email?: string | null
  created_at: string
}

export default function ClientsPage() {
  const router = useRouter()
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
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  )

  // Calculer les statistiques
  const stats = {
    total: clients.length,
    withEmail: clients.filter(c => c.email).length,
    withPhone: clients.filter(c => c.phone).length,
    recentCount: clients.filter(c => {
      const createdDate = new Date(c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return createdDate > thirtyDaysAgo
    }).length,
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Clients" description="Gérez vos clients et leurs informations" />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des clients...</p>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Clients"
        description="Gérez vos clients et leurs informations"
        action={
          <Button
            onClick={() => router.push('/dashboard/clients/new')}
            className="hidden sm:flex gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        }
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground">Total clients</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 border border-blue-500/10">
          <p className="text-sm text-muted-foreground">Avec email</p>
          <p className="text-2xl font-bold text-blue-600">{stats.withEmail}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl p-4 border border-green-500/10">
          <p className="text-sm text-muted-foreground">Avec téléphone</p>
          <p className="text-2xl font-bold text-green-600">{stats.withPhone}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 rounded-xl p-4 border border-violet-500/10">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Nouveaux (30j)</p>
            <UserPlus className="h-3 w-3 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-violet-600">{stats.recentCount}</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, ville, email ou téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12"
        />
      </div>

      {/* Mobile List */}
      {filteredClients.length > 0 && (
        <div className="space-y-3 md:hidden">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="cursor-pointer active:scale-[0.98] transition-all duration-200"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{client.name}</p>
                      {client.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {client.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {(client.phone || client.email) && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table */}
      {filteredClients.length > 0 && (
        <Card className="hidden md:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Client</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer group"
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.city ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {client.city}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {client.phone}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </span>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {clients.length === 0 ? "Aucun client" : "Aucun résultat"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {clients.length === 0
              ? "Ajoutez votre premier client pour commencer"
              : "Aucun client ne correspond à votre recherche"
            }
          </p>
          {clients.length === 0 && (
            <Button onClick={() => router.push('/dashboard/clients/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un client
            </Button>
          )}
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <FloatingActionButton href="/dashboard/clients/new" label="Nouveau client" />
    </LayoutContainer>
  );
}
