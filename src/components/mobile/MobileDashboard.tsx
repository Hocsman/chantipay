'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  signedQuotes: number;
  monthlyRevenue: number;
}

interface MobileDashboardProps {
  stats: DashboardStats;
  recentQuotes?: Array<{
    id: string;
    client_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

export function MobileDashboard({ stats, recentQuotes = [] }: MobileDashboardProps) {
  const router = useRouter();

  const statCards = [
    {
      label: 'Devis au total',
      value: stats.totalQuotes,
      icon: FileText,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'En attente',
      value: stats.pendingQuotes,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    },
    {
      label: 'Signés',
      value: stats.signedQuotes,
      icon: CheckCircle2,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'CA du mois',
      value: `${stats.monthlyRevenue.toLocaleString('fr-FR')} €`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  const quickActions = [
    {
      label: 'Nouveau devis',
      icon: Plus,
      href: '/mobile/quotes/new',
      color: 'bg-primary',
    },
    {
      label: 'Mes clients',
      icon: Users,
      href: '/mobile/clients',
      color: 'bg-blue-600',
    },
    {
      label: 'Planning',
      icon: Calendar,
      href: '/mobile/planning',
      color: 'bg-purple-600',
    },
  ];

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

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl p-4 shadow-sm',
                stat.bgColor
              )}
            >
              <div
                className={cn(
                  'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl',
                  stat.color
                )}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className={cn('text-2xl font-bold', stat.textColor)}>
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Actions rapides
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 shadow-sm transition-transform active:scale-95"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    action.color
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Quotes */}
      {recentQuotes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Devis récents
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/mobile/quotes')}
              className="text-primary"
            >
              Tout voir
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {recentQuotes.slice(0, 5).map((quote) => {
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
        </div>
      )}

      {/* Empty state if no quotes */}
      {recentQuotes.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 p-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-lg">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Aucun devis pour le moment
          </h3>
          <p className="mb-6 text-muted-foreground">
            Créez votre premier devis pour commencer
          </p>
          <Button
            onClick={() => router.push('/mobile/quotes/new')}
            className="w-full"
          >
            <Plus className="mr-2 h-5 w-5" />
            Créer un devis
          </Button>
        </div>
      )}
    </div>
  );
}
