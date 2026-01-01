import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chantipay.app',
  appName: 'ChantiPay',
  webDir: 'www',
  server: {
    url: 'https://www.chantipay.com',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'www.chantipay.com',
      'chantipay.com',
      '*.chantipay.com'
    ]
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
