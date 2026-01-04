'use client';

import { useRouter } from 'next/navigation';
import { FileText, UserPlus, Calendar } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface CreateActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actions = [
  {
    icon: FileText,
    label: 'Nouveau devis',
    description: 'Créer un devis pour un client',
    href: '/dashboard/quotes/new',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: UserPlus,
    label: 'Nouveau client',
    description: 'Ajouter un client ou prospect',
    href: '/dashboard/clients/new',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Calendar,
    label: 'Nouvelle intervention',
    description: 'Planifier une intervention',
    href: '/dashboard/planning/new',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    badge: 'Bientôt',
  },
];

export function CreateActionSheet({ open, onOpenChange }: CreateActionSheetProps) {
  const router = useRouter();

  const handleAction = (href: string, disabled?: boolean) => {
    if (disabled) return;
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Créer</DrawerTitle>
          <DrawerDescription>
            Que souhaitez-vous créer ?
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isDisabled = !!action.badge;

            return (
              <button
                key={action.href}
                onClick={() => handleAction(action.href, isDisabled)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-start gap-4 p-4 rounded-xl transition-colors text-left',
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                <div className={cn('p-3 rounded-full', action.bgColor)}>
                  <Icon className={cn('w-6 h-6', action.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {action.label}
                    </h3>
                    {action.badge && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
