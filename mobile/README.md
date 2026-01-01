# ChantiPay Mobile

Application mobile iOS/Android pour ChantiPay utilisant Capacitor.

## Installation

```bash
cd mobile
npm install
```

## Ajouter les plateformes

```bash
# iOS (nécessite macOS + Xcode)
npm run add:ios

# Android (nécessite Android Studio)
npm run add:android
```

## Ouvrir les projets natifs

```bash
# iOS
npm run ios

# Android
npm run android
```

## Synchroniser les changements

```bash
npm run cap:sync
```

## Configuration

L'application charge directement **https://www.chantipay.com** via `server.url`.

- App ID: `com.chantipay.app`
- App Name: `ChantiPay`
- Web URL: `https://www.chantipay.com`

## Structure

```
mobile/
├── package.json           # Dépendances Capacitor
├── capacitor.config.ts    # Configuration Capacitor
├── ios/                   # Projet iOS (après add:ios)
├── android/              # Projet Android (après add:android)
└── www/                  # Dossier web (non utilisé, on charge l'URL)
```

## Prochaines étapes

1. **Installer les dépendances** : `npm install`
2. **Ajouter iOS** : `npm run add:ios` (macOS uniquement)
3. **Ajouter Android** : `npm run add:android`
4. **Configurer les icônes et splash screens**
5. **Tester sur simulateur/émulateur**
6. **Build de production pour App Store / Play Store**
