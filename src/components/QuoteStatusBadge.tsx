import { type QuoteStatus } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  QuoteStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyé', variant: 'outline' },
  signed: { label: 'Signé', variant: 'default' },
  deposit_paid: { label: 'Acompte payé', variant: 'default' },
  completed: { label: 'Terminé', variant: 'default' },
  canceled: { label: 'Annulé', variant: 'destructive' },
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant={config.variant}
      className={cn(
        status === 'signed' && 'bg-green-500 hover:bg-green-600',
        status === 'deposit_paid' && 'bg-blue-500 hover:bg-blue-600',
        status === 'completed' && 'bg-emerald-600 hover:bg-emerald-700',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
