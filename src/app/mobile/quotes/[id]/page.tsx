'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Mail, Download, Share2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuote = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Erreur:', error);
        router.push('/mobile/quotes');
      } else {
        setQuote(data);
      }
      setLoading(false);
    };

    loadQuote();
  }, [params.id, router]);

  if (loading) {
    return (
      <MobileLayout title="Chargement..." showBottomNav={false}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!quote) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signé';
      case 'sent':
        return 'Envoyé';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  return (
    <MobileLayout
      title="Détails du devis"
      subtitle={`#${quote.id.slice(0, 8)}`}
      showBottomNav={false}
    >
      <div className="p-4 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Informations du devis */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Statut</h3>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                quote.status
              )}`}
            >
              {getStatusLabel(quote.status)}
            </span>
          </div>

          {/* Client */}
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="text-lg font-semibold text-foreground">
              {quote.client_name}
            </p>
            {quote.client_email && (
              <p className="text-sm text-muted-foreground">
                {quote.client_email}
              </p>
            )}
          </div>

          {/* Montant */}
          <div>
            <p className="text-sm text-muted-foreground">Montant</p>
            <p className="text-2xl font-bold text-primary">
              {(quote.total_amount || 0).toLocaleString('fr-FR')} €
            </p>
          </div>

          {/* Date */}
          <div>
            <p className="text-sm text-muted-foreground">Date de création</p>
            <p className="text-foreground">
              {new Date(quote.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Description */}
          {quote.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="text-foreground whitespace-pre-wrap">
                {quote.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full" variant="default">
            <Mail className="mr-2 h-4 w-4" />
            Envoyer par email
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
