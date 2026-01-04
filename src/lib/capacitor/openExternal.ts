/**
 * Capacitor helper utilities for opening external links
 * in the in-app browser instead of breaking the WebView
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running in a native mobile context
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
}

/**
 * Open an external URL in the appropriate way:
 * - Native app: Use Capacitor Browser (in-app browser)
 * - Web: Use standard window.open
 */
export async function openExternal(url: string): Promise<void> {
  if (!url) {
    console.warn('openExternal called with empty URL');
    return;
  }

  if (isNativeApp()) {
    try {
      // Dynamically import Browser only in native context
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({
        url,
        presentationStyle: 'popover', // iOS: popover style
        toolbarColor: '#000000', // Customize toolbar color
      });
      console.log('🌍 Opened in-app browser:', url);
    } catch (error) {
      console.error('❌ Error opening in-app browser:', error);
      // Fallback to window.open
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    // Web browser: standard behavior
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Check if a URL is external (not on the same domain)
 */
export function isExternalUrl(url: string, currentDomain?: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    const current = currentDomain || window.location.hostname;

    // Consider external if:
    // 1. Different hostname
    // 2. Different protocol (http vs https)
    return (
      urlObj.hostname !== current &&
      !urlObj.hostname.endsWith('.chantipay.com') &&
      urlObj.hostname !== 'chantipay.com' &&
      urlObj.hostname !== 'www.chantipay.com'
    );
  } catch {
    // If URL parsing fails, assume it's relative (not external)
    return false;
  }
}

/**
 * Get the current server URL (for deep link mapping)
 */
export function getServerUrl(): string {
  if (typeof window === 'undefined') return 'https://www.chantipay.com';

  // In dev mode, use current origin
  if (window.location.hostname.includes('192.168') || window.location.hostname === 'localhost') {
    return window.location.origin;
  }

  return 'https://www.chantipay.com';
}
