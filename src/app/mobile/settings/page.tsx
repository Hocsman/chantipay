'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBiometric } from '@/hooks/useBiometric';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import {
  Fingerprint,
  Bell,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileSettingsPage() {
  const { biometricInfo, isEnabled: biometricEnabled, enableBiometric, disableBiometric } = useBiometric();
  const { isRegistered: notificationsEnabled, requestPermission, unregister } = usePushNotifications();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBiometricToggle = async () => {
    setLoading('biometric');
    
    if (biometricEnabled) {
      disableBiometric();
    } else {
      const result = await enableBiometric();
      if (!result.success) {
        alert('Erreur lors de l\'activation de la biométrie');
      }
    }
    
    setLoading(null);
  };

  const handleNotificationToggle = async () => {
    setLoading('notifications');
    
    if (notificationsEnabled) {
      await unregister();
    } else {
      const result = await requestPermission();
      if (!result.success) {
        alert('Erreur lors de l\'activation des notifications');
      }
    }
    
    setLoading(null);
  };

  const getBiometricLabel = () => {
    switch (biometricInfo.biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'fingerprint':
        return 'Empreinte digitale';
      default:
        return 'Authentification biométrique';
    }
  };

  return (
    <MobileLayout title="Paramètres" subtitle="Sécurité et notifications">
      <div className="space-y-6 p-4">
        {/* Biometric Authentication */}
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {getBiometricLabel()}
              </h3>
              <p className="text-sm text-muted-foreground">
                Utilisez votre biométrie pour vous connecter rapidement
              </p>
            </div>
          </div>

          {biometricInfo.isAvailable ? (
            <div className="flex items-center justify-between rounded-lg bg-background p-4">
              <div className="flex items-center gap-3">
                {biometricEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="biometric" className="text-sm font-medium">
                  {biometricEnabled ? 'Activée' : 'Désactivée'}
                </Label>
              </div>
              <Switch
                id="biometric"
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={loading === 'biometric'}
              />
            </div>
          ) : (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4 text-sm text-orange-800 dark:text-orange-200">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>
                  Biométrie non disponible sur cet appareil
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Bell className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Notifications Push
              </h3>
              <p className="text-sm text-muted-foreground">
                Recevez des alertes pour vos devis et paiements
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-background p-4">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <Label htmlFor="notifications" className="text-sm font-medium">
                  {notificationsEnabled ? 'Activées' : 'Désactivées'}
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                disabled={loading === 'notifications'}
              />
            </div>

            {notificationsEnabled && (
              <div className="space-y-2 rounded-lg bg-background p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quote-notifications" className="text-sm">
                    Nouveaux devis
                  </Label>
                  <Switch id="quote-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-notifications" className="text-sm">
                    Paiements reçus
                  </Label>
                  <Switch id="payment-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="signature-notifications" className="text-sm">
                    Signatures de devis
                  </Label>
                  <Switch id="signature-notifications" defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium mb-1">💡 Bon à savoir</p>
          <p>
            Ces fonctionnalités nécessitent l'application mobile native pour fonctionner correctement.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
