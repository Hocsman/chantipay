import { type QuoteStatus } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  QuoteStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  },
  sent: {
    label: 'Envoyé',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
  },
  signed: {
    label: 'Signé',
    className: 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/25'
  },
  deposit_paid: {
    label: 'Acompte payé',
    className: 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/25'
  },
  completed: {
    label: 'Terminé',
    className: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
  },
  canceled: {
    label: 'Annulé',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
  },
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      className={cn(
        "transition-all duration-200 hover:scale-105",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
