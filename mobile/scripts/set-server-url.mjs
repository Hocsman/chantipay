#!/usr/bin/env node

/**
 * Script to switch Capacitor server URL between prod and dev
 * Usage:
 *   node set-server-url.mjs prod  # Use https://www.chantipay.com
 *   node set-server-url.mjs dev   # Use http://<LOCAL_IP>:3000
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const configPath = join(rootDir, 'capacitor.config.json');

const mode = process.argv[2];

if (!mode || !['prod', 'dev'].includes(mode)) {
  console.error('❌ Usage: node set-server-url.mjs <prod|dev>');
  process.exit(1);
}

// Get local IP for dev mode
function getLocalIP() {
  try {
    // macOS
    const ip = execSync('ipconfig getifaddr en0', { encoding: 'utf8' }).trim();
    if (ip) return ip;
  } catch (e) {
    // Fallback: try en1 (WiFi on some Macs)
    try {
      const ip = execSync('ipconfig getifaddr en1', { encoding: 'utf8' }).trim();
      if (ip) return ip;
    } catch (e2) {
      console.warn('⚠️  Could not detect local IP automatically');
    }
  }
  
  // Default fallback
  console.warn('⚠️  Using default 192.168.1.100 - update manually if needed');
  return '192.168.1.100';
}

const localIP = getLocalIP();
const devUrl = `http://${localIP}:3000`;
const devUrlAndroid = 'http://10.0.2.2:3000'; // Android emulator special IP
const prodUrl = 'https://www.chantipay.com';

const serverUrl = mode === 'prod' ? prodUrl : devUrl;

// Create or update capacitor.config.json
const config = {
  appId: 'com.chantipay.app',
  appName: 'ChantiPay',
  webDir: 'www',
  server: {
    url: serverUrl,
    cleartext: mode === 'dev', // Allow cleartext only in dev
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'www.chantipay.com',
      'chantipay.com',
      '*.chantipay.com',
      ...(mode === 'dev' ? [localIP] : [])
    ]
  },
  ios: {
    contentInset: 'automatic',
    ...(mode === 'dev' ? {
      // Allow local network access in dev
      allowsArbitraryLoadsInWebContent: true
    } : {})
  },
  android: {
    allowMixedContent: mode === 'dev', // Only in dev
    ...(mode === 'dev' ? {
      useCleartextTraffic: true,
      // Override server URL for Android emulator
      server: {
        url: devUrlAndroid,
        cleartext: true
      }
    } : {})
  }
};

writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`✅ Capacitor config updated to ${mode.toUpperCase()} mode`);
console.log(`📡 Server URL: ${serverUrl}`);

if (mode === 'dev') {
  console.log(`\n💡 Make sure your Next.js dev server is running:`);
  console.log(`   cd .. && npm run dev -- --hostname 0.0.0.0`);
  console.log(`\n🔍 Detected local IP: ${localIP}`);
  console.log(`   If incorrect, update the IP in this script or config manually.`);
}
