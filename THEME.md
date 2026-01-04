# 🎨 Light/Dark Theme System

## Vue d'ensemble

Système de thème complet pour ChantiPay avec support:
- ✅ Mode clair
- ✅ Mode sombre
- ✅ Mode automatique (suit le système)
- ✅ Persistance de la préférence utilisateur
- ✅ Pas de flicker au chargement (SSR-safe)
- ✅ Support Web (desktop + mobile)
- ✅ Support Capacitor (iOS + Android) avec StatusBar natif

## Architecture

### 1. ThemeProvider (`src/components/theme/ThemeProvider.tsx`)
- Gère l'état du thème : `"light" | "dark" | "system"`
- Persiste dans `localStorage` avec la clé `chantipay_theme`
- Applique la classe `dark` sur `<html>`
- Écoute les changements du système quand mode = `"system"`
- Met à jour le StatusBar natif sur iOS/Android

### 2. Script anti-flicker (`src/app/layout.tsx`)
```typescript
<ThemeScript />
```
- Inline script qui s'exécute avant l'hydration React
- Lit le thème depuis localStorage
- Applique immédiatement la classe `dark` si nécessaire
- Évite le flash blanc en mode sombre

### 3. ThemeToggle (`src/components/theme/ThemeToggle.tsx`)
- Dropdown menu avec icônes (Sun, Moon, Laptop)
- Sélection visuelle avec coche
- Accessible et responsive

### 4. Native StatusBar (`mobile/src/themeNative.ts`)
- Synchronise le thème web avec la StatusBar native
- `Style.Light` : texte sombre (mode clair)
- `Style.Dark` : texte clair (mode sombre)
- Android : change aussi la couleur de fond de la barre

## Utilisation

### Hook useTheme()
```typescript
import { useTheme } from '@/components/theme/ThemeProvider'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (résolu)
  // setTheme: (theme) => void
  
  return (
    <button onClick={() => setTheme('dark')}>
      Mode sombre
    </button>
  )
}
```

### Classes Tailwind
```tsx
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-white">
    Texte qui s'adapte au thème
  </p>
</div>
```

### Variables CSS
Utilisez les tokens shadcn/ui dans `globals.css`:
```css
:root {
  --background: oklch(1 0 0);      /* blanc */
  --foreground: oklch(0.145 0 0);  /* noir */
}

.dark {
  --background: oklch(0.145 0 0);  /* noir */
  --foreground: oklch(0.985 0 0);  /* blanc */
}
```

Puis en Tailwind:
```tsx
<div className="bg-background text-foreground">
  S'adapte automatiquement au thème
</div>
```

## Emplacements du toggle

1. **Dashboard header** (desktop)
   - `src/app/dashboard/layout.tsx`
   - À côté du bouton "Nouveau devis"

2. **Page Paramètres**
   - `src/app/dashboard/settings/page.tsx`
   - Carte "Apparence" avec preview du mode actuel

## Mobile Capacitor

### StatusBar automatique
Le plugin `@capacitor/status-bar` est configuré pour:
- Mettre à jour la couleur du texte selon le thème
- Changer la couleur de fond sur Android
- Réagir aux changements de thème en temps réel

### Initialisation
Le fichier `mobile/src/index.ts` initialise automatiquement:
```typescript
import { initNativeTheme } from './themeNative'

// Au démarrage de l'app
initNativeTheme()
```

### Test sur simulateur
```bash
cd mobile

# iOS
npm run use:dev
npm run run:ios

# Android  
npm run use:dev
npm run run:android
```

Changez le thème dans Paramètres et observez:
- La StatusBar change de couleur
- Le background s'adapte
- Tout le contenu suit le thème

## Checklist de vérification

- [x] `darkMode: ["class"]` dans Tailwind config (v4 utilise `@custom-variant`)
- [x] Script anti-flicker dans `<head>`
- [x] ThemeProvider wrape l'app
- [x] Classes `bg-background text-foreground` sur body
- [x] Tokens CSS light/dark dans globals.css
- [x] Toggle dans header dashboard
- [x] Carte thème dans settings
- [x] StatusBar plugin installé
- [x] themeNative.ts créé
- [x] Initialisé dans mobile/src/index.ts
- [x] Build passe sans erreur
- [x] Pas d'hydration mismatch

## Variables d'environnement

Aucune configuration nécessaire. Le système fonctionne out-of-the-box.

## Dépannage

### Le thème ne persiste pas
- Vérifier que `localStorage` est disponible
- Vérifier la clé `chantipay_theme` dans DevTools > Application

### Flash blanc au chargement
- Vérifier que `<ThemeScript />` est dans `<head>`
- Vérifier que `suppressHydrationWarning` est sur `<html>`

### StatusBar ne change pas (mobile)
- Vérifier que `@capacitor/status-bar` est installé
- Vérifier les logs dans Xcode/Android Studio
- Relancer `npx cap sync`

### Tailwind dark: classes ne fonctionnent pas
- Dans Tailwind v4, vérifier `@custom-variant dark (&:is(.dark *));`
- Rebuild après modifications CSS

## Performance

- ✅ Aucun impact sur les Core Web Vitals
- ✅ Script inline < 500 bytes
- ✅ Pas de requête réseau supplémentaire
- ✅ Transitions fluides (CSS transitions)
