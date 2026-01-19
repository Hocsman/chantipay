'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
}

interface Quote {
  id: string
  quote_number: string
  status: QuoteStatus
  total_ttc: number
  total_amount: number
  created_at: string
  client_name: string
  clients?: {
    name: string
  }
  items?: QuoteItem[]
}

export default function MobileQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/mobile/auth');
        return;
      }

      // Charger les devis avec items
      const { data: quotesData } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (name),
          items:quote_items (
            id,
            description,
            quantity,
            unit_price_ht
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'signed':
        return { label: 'Signé', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' };
      case 'sent':
        return { label: 'Envoyé', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' };
      case 'draft':
        return { label: 'Brouillon', color: 'text-gray-600 bg-gray-50 dark:bg-gray-950/30' };
      case 'refused':
        return { label: 'Refusé', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' };
      case 'deposit_paid':
        return { label: 'Acompte payé', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' };
      case 'completed':
        return { label: 'Terminé', color: 'text-green-600 bg-green-50 dark:bg-green-950/30' };
      case 'canceled':
        return { label: 'Annulé', color: 'text-red-600 bg-red-50 dark:bg-red-950/30' };
      default:
        return { label: status, color: 'text-gray-600 bg-gray-50 dark:bg-gray-950/30' };
    }
  };

  // Filtrage des devis
  const filteredQuotes = quotes.filter((quote) => {
    const clientName = quote.clients?.name || quote.client_name || ''
    const totalAmount = (quote.total_ttc || quote.total_amount || 0).toString()
    const itemsDescriptions = quote.items?.map(item => item.description.toLowerCase()).join(' ') || ''

    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery ||
      quote.quote_number?.toLowerCase().includes(searchLower) ||
      clientName.toLowerCase().includes(searchLower) ||
      totalAmount.includes(searchQuery) ||
      itemsDescriptions.includes(searchLower)

    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusFilters: { label: string; value: QuoteStatus | 'all' }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'Brouillon', value: 'draft' },
    { label: 'Envoyé', value: 'sent' },
    { label: 'Signé', value: 'signed' },
  ]

  if (loading) {
    return (
      <MobileLayout title="Devis" subtitle="Gérez vos devis">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const isEmpty = filteredQuotes.length === 0;
  const hasNoResults = quotes.length > 0 && isEmpty;

  return (
    <MobileLayout title="Devis" subtitle="Gérez vos devis">
      {/* Barre de recherche */}
      <div className="p-4 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, client, montant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres par statut */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
            className="whitespace-nowrap"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Contenu */}
      {hasNoResults ? (
        <div className="p-4">
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            description="Essayez de modifier vos critères de recherche"
            variant="colorful"
          />
        </div>
      ) : isEmpty ? (
        <div className="p-4">
          <EmptyState
            icon={FileText}
            title="Aucun devis !"
            description="Créez votre premier devis en cliquant sur le bouton + ci-dessous."
            variant="colorful"
          />
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {filteredQuotes.map((quote) => {
            const statusInfo = getStatusInfo(quote.status);
            const displayName = quote.clients?.name || quote.client_name;
            const displayDate = new Date(quote.created_at).toLocaleDateString('fr-FR');
            const displayAmount = quote.total_ttc || quote.total_amount || 0;

            return (
              <div
                key={quote.id}
                onClick={() => router.push(`/mobile/quotes/${quote.id}`)}
                className="rounded-xl bg-card p-4 shadow-sm transition-transform active:scale-98"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {quote.quote_number} • {displayDate}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      statusInfo.color
                    )}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {displayAmount.toLocaleString('fr-FR')} €
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FloatingActionButton
        href="/mobile/quotes/new"
        label="Nouveau devis"
      />
    </MobileLayout>
  );
}
