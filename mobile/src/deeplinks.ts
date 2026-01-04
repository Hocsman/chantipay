import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Get the current server URL from Capacitor config
 * Falls back to production if not available
 */
function getServerUrl(): string {
  // In a real app, you might read this from a config or runtime variable
  // For now, we'll detect based on the webview's current location
  if (typeof window !== 'undefined' && window.location.hostname.includes('192.168')) {
    // Dev mode - extract the full origin
    return window.location.origin;
  }
  return 'https://www.chantipay.com';
}

/**
 * Initialize deep link handling for Supabase Auth callbacks
 * and other app-specific deep links
 */
export function initializeDeepLinks() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not running on native platform, skipping deep link setup');
    return;
  }

  console.log('🔗 Initializing deep link handler...');

  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const url = event.url;
    console.log('📲 Deep link received:', url);

    try {
      const urlObj = new URL(url);

      // Handle auth callback deep links
      // Supports: chantipay://auth/callback?code=xxx&type=signup
      //       or: com.chantipay.app://auth/callback?code=xxx
      if (
        (urlObj.protocol === 'chantipay:' || urlObj.protocol === 'com.chantipay.app:') &&
        urlObj.pathname.includes('auth/callback')
      ) {
        console.log('✅ Auth callback detected, redirecting to web route...');

        // Get the server URL (dev or prod)
        const serverUrl = getServerUrl();

        // Build the web URL with all query params preserved
        const webUrl = `${serverUrl}/auth/callback${urlObj.search}`;

        console.log('🌐 Navigating to:', webUrl);

        // Navigate the WebView to the auth callback route
        window.location.href = webUrl;
        return;
      }

      // Handle other deep links (future expansion)
      // e.g., chantipay://quote/123, chantipay://dashboard, etc.
      if (urlObj.protocol === 'chantipay:' || urlObj.protocol === 'com.chantipay.app:') {
        const path = urlObj.pathname + urlObj.search;
        const serverUrl = getServerUrl();
        const webUrl = `${serverUrl}${path}`;

        console.log('🌐 Navigating to deep link:', webUrl);
        window.location.href = webUrl;
        return;
      }

      // If it's an external HTTP(S) link, open in in-app browser
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        console.log('🌍 Opening external URL in browser:', url);
        Browser.open({ url });
        return;
      }

      console.warn('⚠️ Unhandled deep link protocol:', urlObj.protocol);
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  });

  console.log('✅ Deep link handler initialized');
}

/**
 * Clean up deep link listeners (call on app shutdown if needed)
 */
export async function cleanupDeepLinks() {
  if (!Capacitor.isNativePlatform()) return;

  await App.removeAllListeners();
  console.log('🧹 Deep link listeners removed');
}
