# 🚀 Quick Start - Deep Links + External Links

## ⚡ Lancement rapide (3 commandes)

```bash
# 1. Configurer Supabase (obligatoire pour les deep links)
# Allez dans Supabase Dashboard et ajoutez ces URLs dans "Redirect URLs":
# - https://www.chantipay.com/auth/callback
# - chantipay://auth/callback

# 2. Lancer l'app iOS
cd mobile
npm run use:dev    # ou use:prod
npm run run:ios

# 3. Tester un deep link
./scripts/test-deeplinks.sh ios
```

## 📋 Ce qui a été fait

✅ **Deep Links Supabase** : Les emails de confirmation/reset password ouvrent l'app  
✅ **In-App Browser** : Les liens externes s'ouvrent dans un navigateur in-app  
✅ **iOS + Android** : Configurations natives complètes  
✅ **Dev/Prod** : Support des deux environnements  
✅ **TypeScript compilé** : Code mobile prêt dans `dist/`  

## 📖 Documentation

- **[SUPABASE_CONFIG.md](./SUPABASE_CONFIG.md)** - URLs à copier-coller dans Supabase (2 min)
- **[DEEPLINKS.md](./DEEPLINKS.md)** - Guide complet iOS/Android + troubleshooting
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Résumé technique détaillé

## 🧪 Tests

```bash
# Test automatique des deep links
./scripts/test-deeplinks.sh ios     # iOS Simulator
./scripts/test-deeplinks.sh android  # Android Emulator

# Test manuel complet
# 1. Lancez l'app
# 2. Créez un compte
# 3. Cliquez sur le lien de confirmation dans l'email
# 4. L'app s'ouvre automatiquement → Dashboard
```

## ⚠️ Action requise avant de tester

**Configurez Supabase maintenant :**

1. Ouvrez https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Authentication > URL Configuration > Redirect URLs
4. Ajoutez :
   ```
   https://www.chantipay.com/auth/callback
   chantipay://auth/callback
   ```
5. Save

Sans cela, les emails de confirmation ne pourront pas ouvrir l'app.

## 🎯 Prochaines étapes

- [ ] Configurer Supabase Redirect URLs (voir ci-dessus)
- [ ] Tester le flux complet d'inscription
- [ ] Ajouter les app icons (iOS + Android)
- [ ] Ajouter les splash screens
- [ ] Build beta pour TestFlight / Play Console

**Tout le code est prêt ! 🎉**
