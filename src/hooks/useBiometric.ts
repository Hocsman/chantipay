'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface BiometricInfo {
  isAvailable: boolean;
  biometryType: 'none' | 'touchId' | 'faceId' | 'fingerprint' | 'faceAuthentication' | 'irisAuthentication';
}

export function useBiometric() {
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo>({
    isAvailable: false,
    biometryType: 'none',
  });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
        const result = await NativeBiometric.isAvailable();
        
        // Map biometry types
        let biometryType: BiometricInfo['biometryType'] = 'none';
        if (result.isAvailable) {
          if (result.biometryType === 0) biometryType = 'none';
          else if (result.biometryType === 1) biometryType = 'touchId';
          else if (result.biometryType === 2) biometryType = 'faceId';
          else if (result.biometryType === 3) biometryType = 'fingerprint';
          else if (result.biometryType === 4) biometryType = 'faceAuthentication';
          else if (result.biometryType === 5) biometryType = 'irisAuthentication';
        }

        setBiometricInfo({
          isAvailable: result.isAvailable,
          biometryType,
        });

        // Check if user has enabled biometric auth
        const enabled = localStorage.getItem('chantipay_biometric_enabled') === 'true';
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Biometric check failed:', error);
      }
    };

    checkBiometric();
  }, []);

  const enableBiometric = async () => {
    if (!Capacitor.isNativePlatform() || !biometricInfo.isAvailable) {
      return { success: false, error: 'Biometric not available' };
    }

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({
        reason: 'Activer l\'authentification biométrique',
        title: 'Authentification',
      });

      localStorage.setItem('chantipay_biometric_enabled', 'true');
      setIsEnabled(true);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const disableBiometric = () => {
    localStorage.removeItem('chantipay_biometric_enabled');
    setIsEnabled(false);
  };

  const authenticate = async () => {
    if (!Capacitor.isNativePlatform() || !isEnabled) {
      return { success: false, error: 'Biometric not enabled' };
    }

    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.verifyIdentity({
        reason: 'Authentifiez-vous pour accéder à ChantiPay',
        title: 'Connexion',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return {
    biometricInfo,
    isEnabled,
    enableBiometric,
    disableBiometric,
    authenticate,
  };
}
