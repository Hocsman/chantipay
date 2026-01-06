import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'colorful';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Illustration Container */}
      <div className={cn(
        'relative w-48 h-48 mb-6 rounded-3xl flex items-center justify-center',
        variant === 'colorful' 
          ? 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
          : 'bg-gradient-to-br from-blue-50 to-blue-100'
      )}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className={cn(
            'absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-60',
            variant === 'colorful' ? 'bg-purple-200' : 'bg-blue-200'
          )} />
          <div className={cn(
            'absolute -bottom-8 -left-8 w-40 h-40 rounded-full blur-2xl opacity-50',
            variant === 'colorful' ? 'bg-pink-200' : 'bg-blue-300'
          )} />
        </div>
        
        {/* Icon */}
        <div className="relative z-10">
          <Icon className={cn(
            'w-24 h-24',
            variant === 'colorful' ? 'text-blue-500' : 'text-blue-400'
          )} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>

      {/* Action */}
      {action && (
        <Button 
          onClick={action.onClick} 
          size="lg"
          className="rounded-full px-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
