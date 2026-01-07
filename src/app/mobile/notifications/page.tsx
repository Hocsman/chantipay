'use client';

import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export default function MobileNotificationsPage() {
  return (
    <MobileLayout title="Notifications" subtitle="Vos dernières notifications">
      <div className="space-y-3 p-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 p-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-lg">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Aucune notification
          </h3>
          <p className="text-muted-foreground">
            Vous êtes à jour ! Aucune nouvelle notification.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
