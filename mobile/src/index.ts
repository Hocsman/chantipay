/**
 * Mobile app bootstrap
 * This file is loaded when the Capacitor app starts
 */

import { initializeDeepLinks } from './deeplinks';

// Initialize deep link handling
console.log('🚀 ChantiPay Mobile App Starting...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDeepLinks();
  });
} else {
  initializeDeepLinks();
}

console.log('✅ Mobile app bootstrap complete');
