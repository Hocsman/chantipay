'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
}

export function usePushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    const setupPushNotifications = async () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Check permission
        const permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'granted') {
          setIsRegistered(true);
        }

        // Listen for notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          setNotifications((prev) => [
            {
              id: Date.now().toString(),
              title: notification.title || '',
              body: notification.body || '',
              data: notification.data,
            },
            ...prev,
          ]);
        });

        // Handle notification tap
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Notification action:', action);
        });

        // Registration success
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

      } catch (error) {
        console.error('Push notification setup failed:', error);
      }
    };

    setupPushNotifications();
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Not a native platform' };
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        setIsRegistered(true);
        return { success: true };
      }

      return { success: false, error: 'Permission denied' };
    } catch (error) {
      return { success: false, error };
    }
  };

  const unregister = async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.unregister();
      setIsRegistered(false);
    } catch (error) {
      console.error('Unregister failed:', error);
    }
  };

  return {
    isRegistered,
    notifications,
    requestPermission,
    unregister,
  };
}
