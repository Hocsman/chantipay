# Guide de Test Mobile - ChantiPay

## 🧪 Tester sur iOS

### 1. Prérequis
- macOS avec Xcode installé
- iPhone ou iPad physique OU simulateur iOS
- Certificat de développement Apple

### 2. Configuration
```bash
cd mobile
npm run use:dev  # Configure l'URL de dev (http://192.168.x.x:3000)
npx cap sync ios
npx cap open ios
```

### 3. Dans Xcode
1. Sélectionner votre device ou simulateur
2. Vérifier le **Bundle Identifier** : `com.chantipay.app`
3. **Product → Run** ou `Cmd+R`

### 4. Tester la biométrie (Face ID)
1. Aller dans `/mobile/settings`
2. Activer "Face ID"
3. Sur simulateur : **Features → Face ID → Enrolled**
4. Tester l'authentification

### 5. Tester les notifications push
⚠️ Les notifications push ne fonctionnent **PAS sur simulateur**
- Nécessite un device physique
- Configuration APNs requise

---

## 🤖 Tester sur Android

### 1. Prérequis
- Android Studio installé
- Device Android physique OU émulateur
- USB Debugging activé (device physique)

### 2. Configuration
```bash
cd mobile
npm run use:dev  # Configure l'URL de dev
npx cap sync android
npx cap open android
```

### 3. Dans Android Studio
1. Attendre la synchronisation Gradle
2. Sélectionner votre device ou émulateur
3. Cliquer sur **Run** (triangle vert)

### 4. Tester la biométrie (Empreinte)
1. Aller dans `/mobile/settings`
2. Activer "Empreinte digitale"
3. Sur émulateur : **Settings → Security → Fingerprint** (configurer)
4. Tester l'authentification

### 5. Tester les notifications push
⚠️ Configuration Firebase requise :
1. Créer projet Firebase
2. Télécharger `google-services.json`
3. Placer dans `mobile/android/app/`
4. Rebuild

---

## 🌐 Tester dans le navigateur

### Navigation mobile
```bash
# Dans le dossier racine
npm run dev
```

Visiter : **http://localhost:3000/mobile**

**Routes disponibles :**
- `/mobile` - Redirection auto
- `/mobile/auth` - Onboarding → Login → Signup
- `/mobile/dashboard` - Dashboard avec stats
- `/mobile/tasks` - Page tâches
- `/mobile/quotes` - Page devis/factures  
- `/mobile/menu` - Menu
- `/mobile/settings` - Paramètres biométrie + notifications

⚠️ **Limitations navigateur :**
- Biométrie non disponible (natif uniquement)
- Notifications push non disponibles (natif uniquement)
- Pas de status bar native
- Pas de safe-area sur iOS

---

## 🔍 Déboguer

### Logs iOS (Xcode)
- Console Xcode : **View → Debug Area → Show Debug Area**
- Filtrer par "Capacitor" ou "ChantiPay"

### Logs Android (Android Studio)
- Logcat : **View → Tool Windows → Logcat**
- Filtrer par "Capacitor" ou "ChantiPay"

### Logs navigateur
- Console Chrome/Safari
- React DevTools

### Inspection remote
**iOS Safari :**
1. Sur iPhone : **Réglages → Safari → Avancé → Inspecteur Web**
2. Sur Mac : **Safari → Développement → [Votre iPhone]**

**Android Chrome :**
1. Chrome sur ordinateur : `chrome://inspect`
2. Sélectionner votre device

---

## 📱 Fonctionnalités à tester

### ✅ Onboarding
- [ ] Affiché à la première ouverture
- [ ] 3 slides avec animations
- [ ] Bouton "Passer"
- [ ] Stockage localStorage (ne se réaffiche pas)

### ✅ Authentification
- [ ] Inscription avec tous les champs
- [ ] Validation mot de passe (min 8 caractères)
- [ ] Connexion email/password
- [ ] Toggle show/hide password
- [ ] Erreurs affichées

### ✅ Dashboard
- [ ] Stats correctes (devis, CA)
- [ ] Actions rapides cliquables
- [ ] Devis récents avec status
- [ ] Empty state si aucun devis

### ✅ Navigation
- [ ] Bottom nav avec 4 items
- [ ] FAB central (bouton +)
- [ ] Navigation active en bleu
- [ ] Transitions fluides

### ✅ Biométrie (natif uniquement)
- [ ] Détection automatique du type (Face ID/Touch ID/Empreinte)
- [ ] Toggle activation/désactivation
- [ ] Prompt natif d'authentification
- [ ] Message d'erreur si refus

### ✅ Notifications (natif uniquement)
- [ ] Demande de permission
- [ ] Toggle activation/désactivation
- [ ] Réception notifications
- [ ] Action au tap sur notification

### ✅ Header mobile
- [ ] Titre + subtitle
- [ ] Icônes chronomètre, QR, notifications
- [ ] Badge notification orange
- [ ] Avatar utilisateur

### ✅ Thème
- [ ] Mode clair par défaut
- [ ] Adaptation au mode sombre
- [ ] Couleurs ChantiPay (bleu #2563eb)

---

## 🚨 Problèmes courants

### "Module not found: @capgo/capacitor-native-biometric"
```bash
# Installer dans le projet principal ET mobile
npm install @capgo/capacitor-native-biometric
cd mobile && npm install @capgo/capacitor-native-biometric
npx cap sync
```

### Build Android échoue
```bash
cd mobile/android
./gradlew clean
cd ../..
npx cap sync android
```

### Build iOS échoue
```bash
cd mobile/ios/App
pod install
cd ../../..
npx cap sync ios
```

### Biométrie ne fonctionne pas
- Vérifier `Info.plist` (iOS) : `NSFaceIDUsageDescription`
- Vérifier `AndroidManifest.xml` : `USE_BIOMETRIC`
- Tester sur device physique (pas simulateur)

### Notifications ne marchent pas
- **iOS** : Certificat APNs requis
- **Android** : `google-services.json` requis
- Tester sur device physique uniquement

---

## 📊 Métriques de performance

### Temps de chargement
- Onboarding : < 1s
- Dashboard : < 2s
- Auth : < 1s

### Taille du bundle
- iOS : ~15-20 MB
- Android : ~10-15 MB

### RAM utilisée
- iOS : ~100-150 MB
- Android : ~80-120 MB

---

## 🚀 Prochaines étapes

1. **Tester tous les flows** sur device physique
2. **Configurer Firebase** pour les notifications Android
3. **Configurer APNs** pour les notifications iOS
4. **Créer les icônes** de l'app (1024x1024)
5. **Screenshots** pour App Store et Play Store
6. **Build de production** :
   ```bash
   npm run build
   cd mobile
   npx cap sync
   # Xcode : Archive → Upload to App Store
   # Android Studio : Build → Generate Signed Bundle
   ```

---

## 📞 Support

En cas de problème :
1. Vérifier les logs (Xcode/Android Studio)
2. Consulter `MOBILE_ARCHITECTURE.md`
3. Vérifier que tous les packages sont installés
4. `npx cap sync` résout 90% des problèmes !
