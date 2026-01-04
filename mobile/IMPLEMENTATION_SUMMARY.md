# ✅ Deep Links & External Links - Implémentation Complète

## 🎉 Ce qui a été fait

### 1. Deep Links Supabase (Auth Callbacks)

**Fichiers créés/modifiés :**
- ✅ `mobile/src/deeplinks.ts` - Handler principal des deep links
- ✅ `mobile/src/index.ts` - Bootstrap qui initialise les deep links au démarrage
- ✅ `mobile/ios/App/App/Info.plist` - Configuration URL Scheme `chantipay://`
- ✅ `mobile/android/app/src/main/AndroidManifest.xml` - Intent filter pour `chantipay://auth`
- ✅ `mobile/tsconfig.json` - Configuration TypeScript
- ✅ `mobile/package.json` - Ajout du script `build`

**Fonctionnalités :**
- Capture les liens `chantipay://auth/callback?code=xxx&type=signup`
- Convertit en URL web : `https://www.chantipay.com/auth/callback?code=xxx&type=signup`
- Navigue automatiquement la WebView vers la bonne route
- Support dev/prod : détecte si on est sur `192.168.x.x:3000` ou production
- Logs détaillés pour debug

### 2. In-App Browser (Liens Externes)

**Fichiers créés/modifiés :**
- ✅ `src/lib/capacitor/openExternal.ts` - Utilitaires de détection et ouverture
- ✅ `src/components/ExternalLinkHandler.tsx` - Intercepteur de clics automatique
- ✅ `src/app/layout.tsx` - Ajout du `<ExternalLinkHandler />` global

**Fonctionnalités :**
- Détecte automatiquement les liens externes (hors domaine chantipay.com)
- Ouvre dans le Browser plugin Capacitor (in-app, avec bouton Fermer)
- Fonctionne pour : privacy, CGU, Stripe checkout, liens docs, etc.
- Ne casse pas la WebView
- Fonctionne uniquement en mode natif (pas d'impact sur le web)

### 3. Documentation

**Fichiers créés :**
- ✅ `mobile/DEEPLINKS.md` - Guide complet (150+ lignes)
  - Configuration Supabase
  - Configuration iOS (Xcode)
  - Configuration Android (Android Studio)
  - Tests et troubleshooting

- ✅ `mobile/SUPABASE_CONFIG.md` - Copier-coller rapide pour Supabase Dashboard
  - URLs à ajouter dans Redirect URLs
  - Vérifications

- ✅ `mobile/scripts/test-deeplinks.sh` - Script de test automatique
  - iOS Simulator : `./scripts/test-deeplinks.sh ios`
  - Android Emulator : `./scripts/test-deeplinks.sh android`

- ✅ `mobile/README.md` - Mis à jour avec section Deep Links

### 4. Build & Compilation

- ✅ TypeScript installé et configuré
- ✅ Fichiers compilés dans `dist/`
- ✅ Capacitor sync effectué (iOS + Android à jour)
- ✅ Plugins synchronisés : @capacitor/app, @capacitor/browser

---

## 🚀 Comment utiliser

### Étape 1 : Configuration Supabase (OBLIGATOIRE)

1. Allez dans **Supabase Dashboard > Authentication > URL Configuration**
2. Ajoutez les Redirect URLs (voir `mobile/SUPABASE_CONFIG.md`)

**URLs minimales :**
```
https://www.chantipay.com/auth/callback
chantipay://auth/callback
```

### Étape 2 : Ouvrir et tester l'app

**iOS :**
```bash
cd mobile
npm run use:dev  # ou use:prod
npm run run:ios
```

**Android :**
```bash
cd mobile
npm run use:dev  # ou use:prod
npm run run:android
```

### Étape 3 : Tester les deep links

**Méthode 1 - Script automatique :**
```bash
cd mobile
./scripts/test-deeplinks.sh ios     # ou android
```

**Méthode 2 - Flux complet :**
1. Dans l'app, créez un nouveau compte
2. Consultez vos emails
3. Cliquez sur le lien de confirmation
4. L'app devrait s'ouvrir et vous rediriger vers `/dashboard`

### Étape 4 : Tester les liens externes

1. Allez sur une page marketing dans l'app
2. Cliquez sur "Politique de confidentialité" ou un lien externe
3. Le lien s'ouvre dans un navigateur in-app (avec bouton "Fermer")
4. Fermez → vous revenez à l'app

---

## 🔍 Vérifications

### Deep Links
- [ ] Supabase Redirect URLs configurées
- [ ] URL Scheme iOS `chantipay://` visible dans Xcode (Info > URL Types)
- [ ] Intent filter Android dans AndroidManifest.xml
- [ ] Test avec script : `./scripts/test-deeplinks.sh ios`
- [ ] Logs console : "Deep link received: chantipay://..."
- [ ] App navigue vers `/auth/callback`

### In-App Browser
- [ ] `<ExternalLinkHandler />` présent dans `layout.tsx`
- [ ] Plugin `@capacitor/browser` installé
- [ ] Lien externe ouvre dans Browser in-app
- [ ] Bouton "Fermer" ramène à l'app

---

## 📁 Structure des fichiers

```
mobile/
├── src/
│   ├── deeplinks.ts          # 🔗 Deep link handler
│   └── index.ts               # 🚀 Bootstrap principal
├── dist/                      # Fichiers JS compilés
│   ├── deeplinks.js
│   └── index.js
├── scripts/
│   ├── set-server-url.mjs     # Switch dev/prod
│   └── test-deeplinks.sh      # Tests automatiques
├── ios/App/App/
│   └── Info.plist             # ✅ URL Scheme configuré
├── android/app/src/main/
│   └── AndroidManifest.xml    # ✅ Intent filter configuré
├── DEEPLINKS.md               # 📖 Doc complète
├── SUPABASE_CONFIG.md         # 📋 Config Supabase
└── README.md                  # 📘 README mis à jour

src/                           # Next.js app
├── lib/capacitor/
│   └── openExternal.ts        # 🌍 Détection liens externes
├── components/
│   └── ExternalLinkHandler.tsx # 🎯 Intercepteur global
└── app/
    ├── layout.tsx             # ✅ Handler activé
    └── auth/callback/
        └── route.ts           # ✅ Route callback existante
```

---

## 🎯 Statut

| Feature | Status | Notes |
|---------|--------|-------|
| Deep Links iOS | ✅ Configuré | URL Scheme `chantipay://` |
| Deep Links Android | ✅ Configuré | Intent filter ajouté |
| Handler TypeScript | ✅ Compilé | `dist/deeplinks.js` |
| Bootstrap mobile | ✅ Actif | `dist/index.js` |
| In-App Browser | ✅ Implémenté | Auto-détection liens externes |
| Supabase Config | ⏳ À faire | Vous devez ajouter les URLs |
| Tests | ✅ Script prêt | `./scripts/test-deeplinks.sh` |
| Documentation | ✅ Complète | 3 fichiers MD |

---

## ⚠️ Action requise

**IMPORTANT :** Avant de tester le flux d'inscription complet, vous DEVEZ configurer Supabase :

1. Ouvrez **[mobile/SUPABASE_CONFIG.md](./mobile/SUPABASE_CONFIG.md)**
2. Copiez-collez les URLs dans Supabase Dashboard
3. Cliquez sur "Save"

Sans cela, les emails de confirmation ne pourront pas ouvrir l'app.

---

## 🐛 Troubleshooting

**L'app ne s'ouvre pas depuis l'email :**
- Vérifiez la config Supabase (Redirect URLs)
- Vérifiez que l'app est installée sur le device/simulator
- Consultez `mobile/DEEPLINKS.md` section Troubleshooting

**Liens externes ouvrent Safari/Chrome :**
- Vérifiez que `<ExternalLinkHandler />` est dans `layout.tsx`
- Vérifiez que `@capacitor/browser` est installé
- Run `npm run sync` dans mobile/

**Erreur TypeScript :**
```bash
cd mobile
npm run build  # Recompile
```

---

## ✅ Prêt pour production !

Une fois Supabase configuré et les tests OK :

1. **Mode production :**
```bash
cd mobile
npm run use:prod
npm run sync
```

2. **Build pour stores :**
- iOS : Xcode > Product > Archive
- Android : Build > Generate Signed Bundle

3. **Checklist finale :**
- [ ] Supabase URLs configurées
- [ ] Tests deep links OK
- [ ] Tests liens externes OK
- [ ] App icons configurés (prochaine étape)
- [ ] Splash screens configurés (prochaine étape)

---

**Implémenté le 1er janvier 2026 🎉**
