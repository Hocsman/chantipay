# Configuration OAuth Google dans Supabase

## Problème identifié

L'écran d'authentification Google affiche "Supabase" au lieu de "ChantiPay" car la configuration OAuth dans Supabase Dashboard utilise les paramètres par défaut.

## Solution : Configurer Google OAuth correctement

### Étape 1 : Créer les credentials Google OAuth

1. Allez sur **Google Cloud Console** : https://console.cloud.google.com
2. Créez un nouveau projet (ou sélectionnez un existant)
   - Nom du projet : **ChantiPay**
3. Activez l'API "Google+ API" ou "People API"
4. Allez dans **APIs & Services** → **Credentials**
5. Cliquez sur **+ CREATE CREDENTIALS** → **OAuth client ID**

### Étape 2 : Configurer l'écran de consentement OAuth

**IMPORTANT** : C'est ici que vous configurez ce qui s'affiche à l'utilisateur !

1. Allez dans **OAuth consent screen** (menu de gauche)
2. Choisissez **External** (pour tous les utilisateurs Google)
3. Remplissez les informations :

```
App name: ChantiPay
User support email: contact@chantipay.com
App logo: (optionnel - téléchargez le logo ChantiPay)

Developer contact information:
Email: contact@chantipay.com
```

4. **Application home page** : https://www.chantipay.com
5. **Privacy Policy** : https://www.chantipay.com/politique-confidentialite
6. **Terms of Service** : https://www.chantipay.com/cgu

7. **Scopes** (étape 2) :
   - Ajoutez ces scopes minimum :
     - `./auth/userinfo.email`
     - `./auth/userinfo.profile`
     - `openid`

8. **Test users** (étape 3) :
   - Ajoutez votre email de test si l'app est en mode "Testing"

9. Cliquez sur **SAVE AND CONTINUE** puis **BACK TO DASHBOARD**

### Étape 3 : Créer les OAuth credentials

1. Retournez dans **Credentials**
2. Créez un **OAuth 2.0 Client ID** :
   - Application type : **Web application**
   - Name : **ChantiPay Web**

3. **Authorized JavaScript origins** :
   ```
   http://localhost:3000
   https://www.chantipay.com
   https://chantipay.vercel.app
   ```

4. **Authorized redirect URIs** :
   ```
   http://localhost:3000/auth/callback
   https://www.chantipay.com/auth/callback
   https://chantipay.vercel.app/auth/callback
   https://<votre-projet-id>.supabase.co/auth/v1/callback
   ```

5. Cliquez sur **CREATE**
6. **Copiez le Client ID et Client Secret**

### Étape 4 : Configurer dans Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet ChantiPay
3. Allez dans **Authentication** → **Providers**
4. Cliquez sur **Google**
5. Activez le provider (toggle ON)

6. Remplissez :
   ```
   Client ID (OAuth): <collez votre Google Client ID>
   Client Secret (OAuth): <collez votre Google Client Secret>
   ```

7. **IMPORTANT** : Copiez l'URL de callback Supabase affichée :
   ```
   https://<votre-projet-id>.supabase.co/auth/v1/callback
   ```

8. Retournez dans Google Cloud Console et ajoutez cette URL dans les **Authorized redirect URIs**

9. Dans Supabase, cliquez sur **Save**

### Étape 5 : Configurer les URLs de redirection Supabase

1. Dans Supabase Dashboard, allez dans **Authentication** → **URL Configuration**

2. **Site URL** :
   ```
   https://www.chantipay.com
   ```

3. **Redirect URLs** (whitelist) :
   ```
   http://localhost:3000/auth/callback
   https://www.chantipay.com/auth/callback
   https://chantipay.vercel.app/auth/callback
   http://localhost:3000/mobile
   https://www.chantipay.com/mobile
   http://localhost:3000/dashboard
   https://www.chantipay.com/dashboard
   ```

4. Cliquez sur **Save**

## Vérification

Après configuration :

1. ✅ L'écran Google OAuth affiche maintenant **"ChantiPay"** au lieu de "Supabase"
2. ✅ Le logo ChantiPay apparaît (si ajouté)
3. ✅ Les liens Politique/CGU pointent vers votre site
4. ✅ L'utilisateur voit "ChantiPay souhaite accéder à..."

## Test

1. Allez sur http://localhost:3000/register
2. Cliquez sur "S'inscrire avec Google"
3. Vérifiez que l'écran affiche **ChantiPay**
4. Sélectionnez votre compte Google
5. Vérifiez la redirection vers `/dashboard`
6. Vérifiez que le profil a été créé dans Supabase

## Logs de débogage

Les logs détaillés sont maintenant affichés dans la console Vercel :

- ✅ User authenticated
- 🆕 Creating new profile for OAuth user
- 📝 Profile data to insert
- ✅ Profile created successfully
- 🔀 Redirecting to

Consultez les logs Vercel pour voir les détails :
```bash
vercel logs
```

## Troubleshooting

### "Redirect URI mismatch"
- Vérifiez que l'URL dans Google Cloud Console correspond exactement
- Pas d'espaces, slash final, etc.

### L'utilisateur revient à la page d'accueil sans être connecté
- Vérifiez les logs dans Vercel
- Vérifiez que le profil a été créé dans Supabase (table `profiles`)
- Vérifiez les cookies du navigateur

### "Access blocked: This app's request is invalid"
- L'écran de consentement OAuth n'est pas configuré
- Retournez à l'Étape 2

## Mode Production vs Testing

**Mode Testing** (développement) :
- Nécessite d'ajouter des "Test users" dans Google Cloud Console
- L'app affiche "Unverified app" warning
- Limité à 100 utilisateurs

**Mode Production** (après vérification Google) :
- Soumettez votre app pour vérification Google
- Processus de vérification : 3-5 jours
- Nécessite domaine vérifié, politique de confidentialité, etc.
- Pas de limite d'utilisateurs

## Documentation officielle

- Google OAuth Setup : https://developers.google.com/identity/protocols/oauth2
- Supabase Google Auth : https://supabase.com/docs/guides/auth/social-login/auth-google
