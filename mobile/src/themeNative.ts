/**
 * Native Theme Integration for Capacitor
 * 
 * Synchronizes the web theme with native StatusBar on iOS/Android
 */

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export async function initNativeTheme() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Theme] Running in web, skipping native theme setup');
    return;
  }

  console.log('[Theme] Initializing native theme support');

  // Get initial theme from localStorage
  const storedTheme = localStorage.getItem('chantipay_theme') || 'system';
  const resolvedTheme = storedTheme === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : storedTheme;

  await updateStatusBar(resolvedTheme as 'light' | 'dark');

  // Listen for theme changes from the web layer
  window.addEventListener('storage', async (e) => {
    if (e.key === 'chantipay_theme') {
      const newTheme = e.newValue || 'system';
      const newResolved = newTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : newTheme;
      
      await updateStatusBar(newResolved as 'light' | 'dark');
    }
  });

  // Listen for system theme changes when mode is 'system'
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', async (e) => {
    const currentTheme = localStorage.getItem('chantipay_theme') || 'system';
    if (currentTheme === 'system') {
      const resolved = e.matches ? 'dark' : 'light';
      await updateStatusBar(resolved);
    }
  });
}

async function updateStatusBar(theme: 'light' | 'dark') {
  try {
    if (theme === 'dark') {
      // Dark theme: light text on dark background
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      // Light theme: dark text on light background
      await StatusBar.setStyle({ style: Style.Light });
    }

    // Android: Set background color to match header
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ 
        color: theme === 'dark' ? '#0a0a0a' : '#ffffff' 
      });
    }

    console.log('[Theme] StatusBar updated to:', theme);
  } catch (error) {
    console.error('[Theme] Failed to update StatusBar:', error);
  }
}
