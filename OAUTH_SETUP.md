# Configuration OAuth (Google & Apple)

## Vue d'ensemble

ChantiPay supporte l'authentification OAuth via **Google** et **Apple**, permettant aux utilisateurs de s'inscrire et se connecter sans créer de mot de passe.

## Fonctionnalités implémentées

✅ **Boutons OAuth sur les pages d'authentification**
- Page de connexion (`/login`)
- Page d'inscription (`/register`)
- Icônes officielles Google et Apple
- États de chargement

✅ **Gestion automatique des profils**
- Création automatique du profil lors de la première connexion OAuth
- Synchronisation des métadonnées utilisateur (nom, email)
- Redirection intelligente vers mobile ou dashboard

✅ **Route de callback OAuth**
- `/auth/callback` gère les redirections Supabase
- Support email confirmation ET OAuth
- Gestion d'erreurs robuste

---

## Configuration Supabase

### 1. Activer les providers OAuth

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet ChantiPay
3. Allez dans **Authentication** → **Providers**

#### Google OAuth

1. Cliquez sur **Google**
2. Activez le provider
3. Configurez les credentials:

**Créer les credentials Google:**
- Allez sur https://console.cloud.google.com/apis/credentials
- Créez un projet (ou sélectionnez-en un existant)
- Créez des "OAuth 2.0 Client IDs"
- Type d'application: **Application Web**
- Origines JavaScript autorisées:
  ```
  http://localhost:3000
  https://votre-domaine.vercel.app
  https://votre-domaine-custom.com
  ```
- URI de redirection autorisés:
  ```
  https://<votre-projet-id>.supabase.co/auth/v1/callback
  ```

4. Copiez le **Client ID** et le **Client Secret** dans Supabase

#### Apple Sign In

1. Cliquez sur **Apple**
2. Activez le provider
3. Configurez les credentials:

**Créer l'App ID Apple:**
- Allez sur https://developer.apple.com/account/resources/identifiers/list
- Créez un nouvel "App ID"
- Activez "Sign In with Apple"
- Configurez les domaines et URLs de retour:
  ```
  https://<votre-projet-id>.supabase.co/auth/v1/callback
  ```

4. Créez une clé de service (Service ID)
5. Téléchargez la clé privée (.p8)
6. Copiez les informations dans Supabase:
   - Services ID
   - Team ID  
   - Key ID
   - Private Key (contenu du fichier .p8)

---

### 2. Configuration des URLs de redirection

Dans **Authentication** → **URL Configuration**:

**Site URL:**
```
https://votre-domaine.vercel.app
```

**Redirect URLs (whitelist):**
```
http://localhost:3000/auth/callback
https://votre-domaine.vercel.app/auth/callback
https://votre-domaine-custom.com/auth/callback
```

---

## Configuration Vercel

Aucune variable d'environnement supplémentaire n'est nécessaire pour OAuth.

Les configurations OAuth sont gérées directement dans Supabase Dashboard.

---

## Test en local

1. Démarrez le serveur de développement:
```bash
npm run dev
```

2. Naviguez vers http://localhost:3000/login

3. Cliquez sur "Continuer avec Google" ou "Continuer avec Apple"

4. Authentifiez-vous avec votre compte

5. Vous devriez être redirigé vers `/dashboard` ou `/mobile` selon la plateforme

---

## Flow d'authentification

```
1. Utilisateur clique sur "Continuer avec Google/Apple"
   ↓
2. Redirection vers le provider OAuth (Google/Apple)
   ↓
3. Utilisateur s'authentifie
   ↓
4. Provider redirige vers Supabase avec un code
   ↓
5. Supabase redirige vers /auth/callback avec le code
   ↓
6. Le callback échange le code contre une session
   ↓
7. Création automatique du profil si première connexion
   ↓
8. Redirection vers /dashboard ou /mobile
```

---

## Gestion des profils OAuth

Lors de la première connexion OAuth, un profil est automatiquement créé avec:

```typescript
{
  id: user.id,                                    // UUID de Supabase Auth
  email: user.email,                              // Email du provider
  full_name: user.user_metadata.full_name,        // Nom complet
  company_name: '',                                // Vide (à remplir par l'utilisateur)
  phone: '',                                       // Vide
  company_address: '',                             // Vide
  company_email: user.email,                      // Email du provider
  siret: '',                                       // Vide
}
```

Les utilisateurs devront compléter leur profil après la première connexion.

---

## Sécurité

✅ **PKCE Flow**: Supabase utilise PKCE (Proof Key for Code Exchange) pour OAuth
✅ **State parameter**: Protection contre les attaques CSRF
✅ **Tokens sécurisés**: Les tokens sont stockés dans des cookies HTTP-only
✅ **Validation serveur**: Le callback vérifie les codes côté serveur

---

## Troubleshooting

### "OAuth provider not configured"
- Vérifiez que le provider est activé dans Supabase Dashboard
- Vérifiez que les credentials sont corrects

### "Redirect URI mismatch"
- Vérifiez que l'URL de callback est dans la whitelist Supabase
- Vérifiez que l'URL est identique dans la console du provider

### "Error creating profile"
- Vérifiez les logs Supabase (Dashboard → Logs)
- Le profil sera créé automatiquement au prochain login si échec

### L'utilisateur n'est pas redirigé
- Vérifiez la console navigateur pour les erreurs JavaScript
- Vérifiez que `redirectTo` est correct dans le code OAuth

---

## Support Mobile (Capacitor)

Pour l'authentification OAuth dans l'app mobile Capacitor:

1. Installez le plugin Capacitor Browser:
```bash
npm install @capacitor/browser
```

2. Configurez les deep links dans `capacitor.config.json`:
```json
{
  "appId": "com.chantipay.app",
  "server": {
    "url": "https://votre-domaine.vercel.app"
  },
  "plugins": {
    "Browser": {
      "presentationStyle": "fullscreen"
    }
  }
}
```

3. Ajoutez les URL schemes dans iOS (Info.plist) et Android (AndroidManifest.xml)

---

## Fichiers modifiés

- `src/app/(auth)/login/page.tsx` - Boutons OAuth login
- `src/app/(auth)/register/page.tsx` - Boutons OAuth inscription
- `src/app/auth/callback/route.ts` - Gestion callback + création profil
- `src/components/ui/separator.tsx` - Séparateur visuel (si nécessaire)

---

## Prochaines étapes recommandées

1. ⚙️ Configurer Google OAuth dans Google Cloud Console
2. ⚙️ Configurer Apple Sign In dans Apple Developer
3. ⚙️ Activer les providers dans Supabase Dashboard
4. ✅ Tester en local avec Google/Apple
5. 🚀 Déployer sur Vercel
6. ✅ Tester en production

---

## Documentation officielle

- [Supabase Auth avec OAuth](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple Sign In Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
