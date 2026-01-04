/**
 * Mobile app bootstrap
 * This file is loaded when the Capacitor app starts
 */

import { initializeDeepLinks } from './deeplinks';
import { initNativeTheme } from './themeNative';

// Initialize deep link handling and native theme
console.log('🚀 ChantiPay Mobile App Starting...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeDeepLinks();
    initNativeTheme();
  });
} else {
  initializeDeepLinks();
  initNativeTheme();
}

console.log('✅ Mobile app bootstrap complete');
