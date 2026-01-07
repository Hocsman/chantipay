'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { EmptyState } from '@/components/mobile/EmptyState';
import { FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotes = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/mobile/auth');
        return;
      }

      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setQuotes(data || []);
      setLoading(false);
    };

    loadQuotes();
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
      <MobileLayout title="Dev./Fac." subtitle="Vos devis et factures">
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (quotes.length === 0) {
    return (
      <MobileLayout title="Dev./Fac." subtitle="Vos devis et factures">
        <div className="p-4">
          <EmptyState
            icon={FileText}
            title="Aucun devis !"
            description="Créez votre premier devis en cliquant sur le bouton + ci-dessous."
            variant="colorful"
          />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Dev./Fac." subtitle="Vos devis et factures">
      <div className="space-y-3 p-4">
        {quotes.map((quote) => {
          const statusInfo = getStatusInfo(quote.status);
          return (
            <div
              key={quote.id}
              onClick={() => router.push(`/mobile/quotes/${quote.id}`)}
              className="rounded-xl bg-card p-4 shadow-sm transition-transform active:scale-98"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {quote.client_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(quote.created_at).toLocaleDateString('fr-FR')}
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
                {(quote.total_amount || 0).toLocaleString('fr-FR')} €
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}
