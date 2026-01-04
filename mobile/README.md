# ChantiPay Mobile

Application mobile iOS/Android pour ChantiPay utilisant Capacitor.

L'application charge le site web **https://www.chantipay.com** dans une WebView native avec accès aux APIs natives (partage, fichiers, navigateur, etc.).

## 📋 Prérequis

### macOS (pour iOS)
- **Xcode** 15+ : [Mac App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** : `sudo gem install cocoapods`
- **Command Line Tools** : `xcode-select --install`

### Android
- **Android Studio** : [developer.android.com](https://developer.android.com/studio)
- **JDK 17+** : `brew install openjdk@17`
- **Android SDK** (via Android Studio)

### Node.js
- Node 18+ et npm

## 🚀 Installation

```bash
cd mobile
npm install
```

Les plateformes iOS et Android sont déjà ajoutées dans les dossiers `ios/` et `android/`.

## 🔧 Workflow de développement

### Mode PRODUCTION (par défaut)

L'app charge directement **https://www.chantipay.com** en production.

```bash
npm run use:prod
npm run run:ios      # Ouvre Xcode
npm run run:android  # Ouvre Android Studio
```

### Mode DÉVELOPPEMENT (serveur local)

Pour tester avec votre serveur Next.js local :

#### 1️⃣ Démarrer le serveur Next.js sur le réseau local

```bash
# Depuis la racine du projet (pas dans mobile/)
cd ..
npm run dev -- --hostname 0.0.0.0 --port 3000
```

#### 2️⃣ Trouver votre IP locale

**macOS** :
```bash
ipconfig getifaddr en0
# Exemple : 192.168.1.42
```

**Linux** :
```bash
hostname -I | awk '{print $1}'
```

**Windows** :
```cmd
ipconfig
# Chercher "IPv4 Address"
```

#### 3️⃣ Configurer Capacitor en mode dev

```bash
cd mobile
npm run use:dev
```

Le script détectera automatiquement votre IP locale. Si elle est incorrecte, éditez `scripts/set-server-url.mjs`.

#### 4️⃣ Synchroniser et ouvrir

```bash
npm run run:ios      # Ouvre Xcode
# ou
npm run run:android  # Ouvre Android Studio
```

#### 5️⃣ Lancer l'app depuis Xcode/Android Studio

- **iOS** : Sélectionner un simulateur → Run (⌘R)
- **Android** : Sélectionner un émulateur → Run (Shift+F10)

### 🔄 Après modifications du code web

Chaque fois que vous modifiez le code Next.js :

1. Le serveur local se recharge automatiquement (Fast Refresh)
2. **Rafraîchir l'app mobile** (pull to refresh ou redémarrer l'app)

Pas besoin de `npx cap sync` si seul le code web change !

### 📱 Synchroniser les changements natifs

Si vous modifiez :
- Des plugins Capacitor
- La configuration `capacitor.config.json`
- Des assets natifs

Exécutez :
```bash
npm run sync
```

## 📦 Plugins installés

| Plugin | Usage |
|--------|-------|
| `@capacitor/app` | Lifecycle events, deep links |
| `@capacitor/browser` | Ouvrir URLs externes |
| `@capacitor/share` | Partager PDF/contenu |
| `@capacitor/filesystem` | Lire/écrire fichiers |

## 🛠️ Scripts npm disponibles

```bash
npm run use:prod       # Basculer en mode PRODUCTION
npm run use:dev        # Basculer en mode DÉVELOPPEMENT
npm run sync           # Synchroniser Capacitor
npm run run:ios        # Ouvrir projet Xcode
npm run run:android    # Ouvrir projet Android Studio
```

## ⚠️ Sécurité

### Mode PRODUCTION
- ✅ HTTPS uniquement (`https://www.chantipay.com`)
- ✅ Pas de cleartext traffic
- ✅ App Transport Security activé

### Mode DÉVELOPPEMENT
- ⚠️ HTTP autorisé pour `http://<LOCAL_IP>:3000`
- ⚠️ `allowsArbitraryLoadsInWebContent` activé (iOS)
- ⚠️ `useCleartextTraffic` activé (Android)

**IMPORTANT** : Toujours revenir en mode `prod` avant de build pour les stores !

## 🏗️ Build de production

### iOS (App Store)

```bash
npm run use:prod
npm run sync
npm run run:ios
```

Dans Xcode :
1. Product → Archive
2. Distribute App → App Store Connect

### Android (Play Store)

```bash
npm run use:prod
npm run sync
npm run run:android
```

Dans Android Studio :
1. Build → Generate Signed Bundle / APK
2. Sélectionner "Android App Bundle"
3. Signer avec votre keystore

## 🐛 Troubleshooting

### iOS : "No Xcode project found"
```bash
cd ios/App
pod install
```

### Android : "Unable to locate a Java Runtime"
```bash
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

### L'app ne se connecte pas au serveur local
1. Vérifier que le serveur Next.js tourne sur `0.0.0.0:3000`
2. Vérifier l'IP dans `capacitor.config.json`
3. Vérifier que votre téléphone/simulateur est sur le même réseau WiFi
4. Désactiver le pare-feu temporairement pour tester

### Erreur "cleartext traffic not permitted"
```bash
npm run use:dev  # Réactive cleartext pour dev
npm run sync
```

## 📚 Documentation

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Developer Guide](https://capacitorjs.com/docs/ios)
- [Android Developer Guide](https://capacitorjs.com/docs/android)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

## 🎯 Prochaines étapes

- [ ] Configurer icônes et splash screens
- [x] ~~Ajouter deep links (URL scheme)~~ ✅ **Configuré !** (voir DEEPLINKS.md)
- [x] ~~Liens externes en in-app browser~~ ✅ **Implémenté !**
- [ ] Tester notifications push
- [ ] Build beta TestFlight / Play Console
- [ ] Soumettre aux stores

---

## 📱 Deep Links & Liens Externes

### ✅ Deep Links Supabase (auth callbacks)

Les deep links permettent aux emails Supabase (confirmation, reset password) d'ouvrir directement l'app mobile.

**Configuration rapide :**
1. Suivez les instructions dans **[SUPABASE_CONFIG.md](./SUPABASE_CONFIG.md)**
2. Les URLs iOS/Android sont déjà configurées dans le code
3. Testez avec : `./scripts/test-deeplinks.sh ios` ou `android`

**Documentation complète :** [DEEPLINKS.md](./DEEPLINKS.md)

### ✅ In-App Browser pour liens externes

Les liens externes (privacy, CGU, Stripe, etc.) s'ouvrent automatiquement dans un navigateur in-app au lieu de quitter l'app.

**Implémenté via :**
- `src/lib/capacitor/openExternal.ts` - Détection et ouverture intelligente
- `src/components/ExternalLinkHandler.tsx` - Intercepteur automatique
- Plugin `@capacitor/browser` - Navigateur in-app natif

**Aucune configuration requise, fonctionne automatiquement ! 🚀**

---

