'use client';

import { useEffect } from 'react';
import { isNativeApp, openExternal, isExternalUrl } from '@/lib/capacitor/openExternal';

/**
 * Client component that intercepts external link clicks
 * and opens them in the in-app browser when running in Capacitor
 */
export function ExternalLinkHandler() {
  useEffect(() => {
    // Only intercept clicks in native app
    if (!isNativeApp()) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      // Find the closest anchor tag
      const anchor = (event.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Check if it's an external link
      if (isExternalUrl(href)) {
        console.log('🔗 Intercepted external link:', href);
        event.preventDefault();
        event.stopPropagation();
        openExternal(href);
      }
    };

    // Attach click listener to document
    document.addEventListener('click', handleClick, true);

    console.log('✅ External link handler attached');

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return null; // This component doesn't render anything
}
