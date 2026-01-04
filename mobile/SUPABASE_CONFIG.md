# Configuration Supabase pour Deep Links Mobile

## 🔐 À configurer dans Supabase Dashboard

### 1. Accéder aux paramètres

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **ChantiPay**
3. Cliquez sur **Authentication** dans le menu de gauche
4. Cliquez sur **URL Configuration**

---

## 📋 URLs à copier-coller

### Site URL
```
https://www.chantipay.com
```

### Redirect URLs (ajoutez TOUTES ces lignes)

**Production (obligatoire) :**
```
https://www.chantipay.com/auth/callback
chantipay://auth/callback
com.chantipay.app://auth/callback
```

**Développement (optionnel, pour tester localement) :**
```
http://192.168.0.114:3000/auth/callback
http://localhost:3000/auth/callback
```

> **Note :** Remplacez `192.168.0.114` par votre IP locale si différente

---

## ✅ Vérification

Dans la section **Redirect URLs**, vous devriez avoir au minimum :

```
https://www.chantipay.com/auth/callback
chantipay://auth/callback
```

Cliquez sur **Save** après avoir ajouté toutes les URLs.

---

## 🧪 Test

Pour tester que tout fonctionne :

1. **Inscription depuis l'app mobile**
   - Ouvrez l'app iOS/Android
   - Créez un nouveau compte
   - Vérifiez votre email

2. **Cliquez sur le lien de confirmation**
   - L'app mobile devrait s'ouvrir automatiquement
   - Vous devriez être redirigé vers le dashboard

3. **Si ça ne fonctionne pas :**
   - Vérifiez que les URLs sont bien enregistrées dans Supabase
   - Consultez le fichier `mobile/DEEPLINKS.md` pour le troubleshooting

---

## 📧 Templates d'emails (optionnel)

Si vous voulez personnaliser vos emails, allez dans **Authentication > Email Templates**.

Les templates par défaut de Supabase fonctionnent déjà avec les deep links configurés ci-dessus.

---

## 🔗 Ressources

- Documentation complète : `mobile/DEEPLINKS.md`
- Code source deep links : `mobile/src/deeplinks.ts`
- Handler externe : `src/lib/capacitor/openExternal.ts`
