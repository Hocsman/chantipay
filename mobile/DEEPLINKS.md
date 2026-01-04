# Deep Links & External Links - Configuration Guide

## 📋 Table des matières

1. [Supabase Configuration](#supabase-configuration)
2. [iOS Configuration (Xcode)](#ios-configuration)
3. [Android Configuration](#android-configuration)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 Supabase Configuration

### 1. Dans Supabase Dashboard > Authentication > URL Configuration

**Site URL:**
```
https://www.chantipay.com
```

**Redirect URLs (ajoutez TOUTES ces URLs):**
```
https://www.chantipay.com/auth/callback
chantipay://auth/callback
com.chantipay.app://auth/callback
```

**Pour le développement (optionnel):**
```
http://192.168.0.114:3000/auth/callback
http://localhost:3000/auth/callback
```
*(Remplacez `192.168.0.114` par votre IP locale)*

### 2. Email Templates

Vérifiez que vos templates d'email Supabase pointent vers les bonnes URLs :

**Confirm signup (Confirmation d'inscription):**
```html
<a href="{{ .ConfirmationURL }}">Confirmer mon compte</a>
```

**Reset password (Réinitialisation mot de passe):**
```html
<a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a>
```

Supabase redirigera automatiquement vers les URLs autorisées ci-dessus.

### 3. Code côté client (déjà implémenté)

Dans votre app Next.js, lors de l'inscription/réinitialisation :

```typescript
// Détecte si on est dans l'app mobile
const isNative = window.Capacitor?.isNativePlatform?.();

const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: isNative 
      ? 'chantipay://auth/callback'
      : 'https://www.chantipay.com/auth/callback',
  },
});
```

---

## 📱 iOS Configuration

### 1. Ouvrir le projet iOS

```bash
cd mobile
npm run run:ios
```

### 2. Dans Xcode

#### A. Configurer le URL Scheme

1. Sélectionnez le projet **App** dans le navigateur
2. Cliquez sur la cible **App**
3. Allez dans l'onglet **Info**
4. Développez **URL Types**
5. Cliquez sur **+** pour ajouter un nouveau URL Type :

```
Identifier: com.chantipay.app.auth
URL Schemes: chantipay
```

![Xcode URL Scheme](https://docs.capacitorjs.com/assets/img/guides/deep-links/ios-url-scheme.png)

#### B. (Optionnel) Universal Links

Pour une expérience plus native, configurez les Universal Links :

1. Allez dans l'onglet **Signing & Capabilities**
2. Cliquez sur **+ Capability**
3. Ajoutez **Associated Domains**
4. Ajoutez :
```
applinks:chantipay.com
applinks:www.chantipay.com
```

**Note:** Nécessite un fichier `apple-app-site-association` sur votre serveur web.

### 3. Info.plist (vérification)

Le fichier `ios/App/App/Info.plist` devrait automatiquement contenir :

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.chantipay.app.auth</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>chantipay</string>
    </array>
  </dict>
</array>
```

---

## 🤖 Android Configuration

### 1. Ouvrir le projet Android

```bash
cd mobile
npm run run:android
```

### 2. Éditer AndroidManifest.xml

Fichier: `android/app/src/main/AndroidManifest.xml`

Ajoutez cet `<intent-filter>` dans `<activity>` principale :

```xml
<activity
    android:name=".MainActivity"
    ...>
    
    <!-- Existing intent filters -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- ADD THIS: Deep link handler for auth callbacks -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Custom scheme: chantipay://auth/callback -->
        <data
            android:scheme="chantipay"
            android:host="auth" />
    </intent-filter>
    
    <!-- OPTIONAL: App Links (Universal Links equivalent) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <data
            android:scheme="https"
            android:host="www.chantipay.com"
            android:pathPrefix="/auth" />
    </intent-filter>
    
</activity>
```

### 3. (Optionnel) App Links

Pour activer les App Links Android, créez un fichier `assetlinks.json` :

**Fichier:** `public/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.chantipay.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT_HERE"
    ]
  }
}]
```

Obtenez votre fingerprint avec :
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 🧪 Testing

### Test 1: Deep Link depuis Safari/Chrome (simulateur)

```bash
# iOS Simulator
xcrun simctl openurl booted "chantipay://auth/callback?code=test123&type=signup"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "chantipay://auth/callback?code=test123&type=signup"
```

### Test 2: Flux complet d'inscription

1. Lancez l'app en mode DEV :
```bash
cd mobile
npm run use:dev
npm run run:ios  # ou run:android
```

2. Dans l'app, allez sur `/register`
3. Créez un compte avec un email valide
4. Consultez vos emails sur votre téléphone/tablette
5. Cliquez sur le lien de confirmation
6. L'app devrait s'ouvrir automatiquement et vous rediriger vers `/dashboard`

### Test 3: Liens externes

1. Dans l'app, allez sur une page marketing
2. Cliquez sur "Politique de confidentialité" (lien externe)
3. Le lien devrait s'ouvrir dans un navigateur in-app (Browser plugin)
4. Vous devriez pouvoir fermer et revenir à l'app

### Test 4: Vérifier les logs

**iOS (Xcode):**
- Console > Filter: "Deep link" ou "ChantiPay"

**Android (Logcat):**
```bash
adb logcat | grep -i "chantipay\|deep\|capacitor"
```

---

## 🔧 Troubleshooting

### Problème: Deep link ne s'ouvre pas

**Solution iOS:**
1. Vérifiez que le URL Scheme est bien configuré dans Info.plist
2. Rebuild l'app : Product > Clean Build Folder, puis relancez
3. Vérifiez les logs Xcode

**Solution Android:**
1. Vérifiez AndroidManifest.xml (intent-filter correct)
2. Reinstallez l'app : `adb uninstall com.chantipay.app && npm run run:android`
3. Testez avec `adb shell am start ...`

### Problème: App s'ouvre mais ne navigue pas

**Diagnostic:**
- Ouvrez la console du navigateur dans l'app
- Cherchez les erreurs JavaScript
- Vérifiez que `mobile/src/deeplinks.ts` est bien chargé

**Solution:**
```bash
# Resynchroniser les plugins Capacitor
cd mobile
npx cap sync
```

### Problème: Liens externes ouvrent Safari/Chrome au lieu du Browser in-app

**Cause:** `ExternalLinkHandler` pas actif ou Browser plugin manquant

**Solution:**
```bash
cd mobile
npm install @capacitor/browser@^8.0.0
npx cap sync
```

Vérifiez que `<ExternalLinkHandler />` est bien dans `layout.tsx`.

### Problème: "Unable to resolve module @capacitor/browser"

**Solution:**
```bash
# Dans le projet Next.js (pas mobile/)
npm install @capacitor/browser@^8.0.0
npm install @capacitor/core@^8.0.0
```

### Problème: Dev mode - l'app ne charge pas le serveur local

**Vérification:**
```bash
# Testez que le serveur est accessible
curl http://192.168.0.114:3000

# Vérifiez la config Capacitor
cat mobile/capacitor.config.json | grep url
```

**Solution:**
1. Assurez-vous que Next.js tourne avec `--hostname 0.0.0.0`
2. Vérifiez que votre Mac/téléphone sont sur le même réseau WiFi
3. Relancez `npm run use:dev` pour détecter la bonne IP

---

## 📚 Ressources

- [Capacitor Deep Links Documentation](https://capacitorjs.com/docs/guides/deep-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] Supabase Redirect URLs configurées (prod + custom schemes)
- [ ] iOS URL Scheme `chantipay` configuré
- [ ] Android intent-filter ajouté dans AndroidManifest
- [ ] Tests deep links OK sur simulateur/émulateur
- [ ] Tests liens externes ouvrent Browser in-app
- [ ] Flux inscription complet testé (email → deep link → dashboard)
- [ ] Code de détection `isNativeApp()` fonctionne
- [ ] Logs console propres (pas d'erreurs Capacitor)

**Bon lancement ! 🚀**
