# Architecture Mobile ChantiPay

## 📱 Vue d'ensemble

ChantiPay dispose d'une expérience mobile native complète avec :
- Onboarding (3 slides)
- Authentification mobile (connexion/inscription)
- Dashboard optimisé
- Support biométrique (Face ID / Touch ID / Empreinte)
- Notifications push
- Design blanc/noir inspiré d'InterFast

## 🗂️ Structure des fichiers

```
src/
├── app/mobile/                    # Routes mobiles
│   ├── page.tsx                   # Redirection auto (auth ou dashboard)
│   ├── layout.tsx                 # Layout racine mobile
│   ├── auth/
│   │   └── page.tsx               # Onboarding → Login → Signup
│   ├── dashboard/
│   │   └── page.tsx               # Dashboard mobile optimisé
│   └── settings/
│       └── page.tsx               # Paramètres (biométrie + notifications)
│
├── components/mobile/             # Composants mobiles
│   ├── MobileLayout.tsx           # Layout principal mobile
│   ├── MobileHeader.tsx           # Header bleu avec icônes (modifié)
│   ├── MobileBottomNavV2.tsx      # Navigation inférieure avec FAB
│   ├── MobileDashboard.tsx        # Dashboard avec stats et actions rapides
│   ├── Onboarding.tsx             # 3 slides d'onboarding
│   └── auth/
│       ├── MobileLogin.tsx        # Page de connexion
│       └── MobileSignup.tsx       # Page d'inscription
│
└── hooks/
    ├── useBiometric.ts            # Hook pour authentification biométrique
    └── usePushNotifications.ts    # Hook pour notifications push
```

## 🎨 Design

### Couleurs
- **Header**: `bg-primary` (bleu ChantiPay #2563eb)
- **Background**: `bg-background` (blanc/noir selon le thème)
- **Cards**: `bg-card` avec shadow-sm
- **FAB**: `bg-primary` centré dans le bottom nav

### Composants inspirés d'InterFast
- Header avec icônes (chronomètre, QR code, notifications, avatar)
- Stats cards avec icônes colorées
- Actions rapides en grille
- Bottom nav avec 4 items + FAB central
- Empty states avec gradients colorés

## 🔐 Authentification

### Flow utilisateur
1. **Première visite** : Onboarding (3 slides) → Login
2. **Visites suivantes** : Login direct (onboarding skip via localStorage)
3. **Utilisateur connecté** : Redirection automatique vers dashboard

### Pages
- `/mobile/auth` : Gère onboarding + login + signup
- Stockage : `localStorage.getItem('chantipay_onboarding_seen')`

## 📊 Dashboard Mobile

### Statistiques affichées
- Total des devis
- Devis en attente
- Devis signés
- CA du mois

### Actions rapides
- Nouveau devis
- Mes clients
- Planning

### Devis récents
- Liste des 5 derniers devis
- Status colorés (Signé, Envoyé, Brouillon)
- Montant en gras
- Redirection vers détails au clic

## 🔒 Biométrie

### Configuration
- **Package à installer** : `@capgo/capacitor-native-biometric`
- **Hook** : `useBiometric()` dans `src/hooks/useBiometric.ts`
- **Stockage** : `localStorage.getItem('chantipay_biometric_enabled')`

### Utilisation
```tsx
const { biometricInfo, isEnabled, enableBiometric, authenticate } = useBiometric();

// Vérifier la disponibilité
if (biometricInfo.isAvailable) {
  // Face ID, Touch ID, ou Empreinte
  console.log(biometricInfo.biometryType);
}

// Activer
await enableBiometric();

// S'authentifier
const result = await authenticate();
```

### Page de configuration
`/mobile/settings` : Toggle pour activer/désactiver la biométrie

## 🔔 Notifications Push

### Configuration
- **Package à installer** : `@capacitor/push-notifications`
- **Hook** : `usePushNotifications()` dans `src/hooks/usePushNotifications.ts`

### Utilisation
```tsx
const { isRegistered, notifications, requestPermission } = usePushNotifications();

// Demander la permission
await requestPermission();

// Notifications reçues
notifications.forEach(notif => {
  console.log(notif.title, notif.body);
});
```

### Types de notifications
- Nouveaux devis
- Paiements reçus
- Signatures de devis

### Configuration Firebase/APNs
- **Android** : Firebase Cloud Messaging (FCM)
- **iOS** : Apple Push Notification service (APNs)

## 🚀 Routes mobiles

| Route | Description |
|-------|-------------|
| `/mobile` | Redirection auto (auth ou dashboard) |
| `/mobile/auth` | Onboarding → Login → Signup |
| `/mobile/dashboard` | Dashboard optimisé mobile |
| `/mobile/settings` | Paramètres biométrie + notifications |

## 🔄 Détection de plateforme

### Hooks disponibles
```tsx
import { useIsNativeApp, useIsPlatform } from '@/hooks/usePlatform';

const isNative = useIsNativeApp(); // true sur iOS/Android
const isIOS = useIsPlatform('ios');
const isAndroid = useIsPlatform('android');
```

### Capacitor.isNativePlatform()
```tsx
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Code natif uniquement
}
```

## 📦 Packages à installer (TODO)

```bash
# Biométrie
npm install @capgo/capacitor-native-biometric

# Notifications push
npm install @capacitor/push-notifications
```

## 🎯 Prochaines étapes

### Phase 1 ✅ (Terminée)
- [x] MobileLayout avec MobileHeader + MobileBottomNavV2
- [x] Détection auto native/web
- [x] Header style InterFast (bleu avec icônes)

### Phase 2 ✅ (Terminée)
- [x] Onboarding (3 slides)
- [x] MobileLogin
- [x] MobileSignup
- [x] Page /mobile/auth avec flow complet

### Phase 3 ✅ (Terminée)
- [x] MobileDashboard avec stats
- [x] Actions rapides
- [x] Devis récents
- [x] Empty state avec gradient

### Phase 4 ✅ (Structure créée)
- [x] Hook useBiometric (prêt pour plugin)
- [x] Hook usePushNotifications (prêt pour plugin)
- [x] Page /mobile/settings
- [ ] Installer @capgo/capacitor-native-biometric
- [ ] Installer @capacitor/push-notifications
- [ ] Configurer Firebase (Android)
- [ ] Configurer APNs (iOS)

### Phase 5 (À venir)
- [ ] Pages mobiles pour Clients, Devis, Planning
- [ ] Optimisation des formulaires pour mobile
- [ ] Gestion offline avec Capacitor Storage
- [ ] Tests sur iOS et Android

## 🧪 Tests

### En local (browser)
```bash
npm run dev
# Visiter http://localhost:3000/mobile
```

### Sur device iOS
```bash
cd mobile
npm run use:dev  # Configure l'URL locale
npx cap sync ios
npx cap open ios
```

### Sur device Android
```bash
cd mobile
npm run use:dev
npx cap sync android
npx cap open android
```

## 📝 Notes

- **Onboarding** : Affiché uniquement à la première visite
- **Couleurs** : Blanc/noir avec accents bleus ChantiPay
- **Design** : Inspiré d'InterFast (sans copier les couleurs)
- **Backend** : Partagé avec la version web (Supabase)
- **Auth** : Supabase Auth avec support biométrique optionnel
- **Offline** : Non supporté (nécessite internet)
