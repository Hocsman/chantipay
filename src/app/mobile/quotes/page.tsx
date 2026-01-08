'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { FileText, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'devis' | 'factures';

export default function MobileQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('devis');

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

      // Charger les devis
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setQuotes(quotesData || []);

      // Pour l'instant, les factures sont vides (à implémenter plus tard)
      setInvoices([]);
      
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
      default:
        return { label: status, color: 'text-gray-600 bg-gray-50 dark:bg-gray-950/30' };
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Devis / Fact." subtitle="Vos devis et factures">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const currentData = activeTab === 'devis' ? quotes : invoices;
  const isEmpty = currentData.length === 0;

  return (
    <MobileLayout title="Devis / Fact." subtitle="Vos devis et factures">
      {/* Onglets */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('devis')}
            className={cn(
              'flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
              activeTab === 'devis'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Devis
            {activeTab === 'devis' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('factures')}
            className={cn(
              'flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
              activeTab === 'factures'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Factures
            {activeTab === 'factures' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Contenu */}
      {isEmpty ? (
        <div className="p-4">
          <EmptyState
            icon={activeTab === 'devis' ? FileText : Receipt}
            title={activeTab === 'devis' ? 'Aucun devis !' : 'Aucune facture !'}
            description={
              activeTab === 'devis'
                ? 'Créez votre premier devis en cliquant sur le bouton + ci-dessous.'
                : 'Les factures apparaîtront ici une fois créées.'
            }
            variant="colorful"
          />
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {currentData.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/mobile/quotes/${item.id}`)}
                className="rounded-xl bg-card p-4 shadow-sm transition-transform active:scale-98"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {item.client_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('fr-FR')}
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
                  {(item.total_amount || 0).toLocaleString('fr-FR')} €
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MobileLayout>
  );
}
