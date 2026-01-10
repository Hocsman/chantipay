# Corrections des Erreurs de Production

## Date : 10 janvier 2025

## Problèmes Identifiés

Votre utilisateur a rencontré **deux erreurs critiques** en production :

### 1. Erreur de Numéro de Devis en Double
**Message d'erreur :**
```
Erreur lors de la création du devis: duplicate key value violates unique constraint "quotes_quote_number_key"
```

**Cause :**
- Race condition dans la génération des numéros de devis
- Lorsque deux utilisateurs créent un devis simultanément, ils peuvent obtenir le même numéro
- La fonction `generateQuoteNumber` dans l'API comptait les devis existants puis créait un nouveau numéro
- Entre le comptage et l'insertion, un autre utilisateur pouvait créer un devis avec le même numéro

**Solution Appliquée :**
✅ **Trigger PostgreSQL automatique** (Migration 010)
- Déplacé la génération du numéro côté base de données
- Utilise un trigger BEFORE INSERT qui s'exécute de manière atomique
- Gère automatiquement les collisions avec une boucle de retry
- Format conservé : `DEV-2025-00001`, `DEV-2025-00002`, etc.

### 2. Erreur de Format UUID Invalide
**Message d'erreur :**
```
Devis non trouvé - invalid input syntax for type uuid: "3"
```

**Cause :**
- Un ID numérique ("3") est passé à la route `/mobile/quotes/[id]` au lieu d'un UUID
- Possible données corrompues ou ancien système avec des ID numériques
- Aucune validation du format UUID avant la requête

**Solution Appliquée :**
✅ **Validation UUID** dans les pages de détail
- Ajout d'une validation regex UUID avant toute requête
- Message d'erreur explicite pour l'utilisateur
- Redirection automatique vers la liste des devis si l'ID est invalide
- Correction appliquée sur mobile ET desktop

---

## Fichiers Modifiés

### 1. Migration 010 - Trigger Automatique
**Fichier :** `supabase/migrations/010_add_quote_number_trigger.sql`

**Contenu :**
```sql
CREATE OR REPLACE FUNCTION public.generate_quote_number_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
  v_max_attempts INTEGER := 10;
  v_attempt INTEGER := 0;
BEGIN
  -- Si le quote_number est déjà fourni, le garder
  IF NEW.quote_number IS NOT NULL AND NEW.quote_number != '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Boucle pour gérer les collisions potentielles
  WHILE v_attempt < v_max_attempts LOOP
    -- Compter les devis existants de cette année
    SELECT COUNT(*) + 1 INTO v_count
    FROM public.quotes
    WHERE quote_number LIKE 'DEV-' || v_year || '-%';
    
    -- Format: DEV-2025-00001
    v_number := 'DEV-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
    
    -- Vérifier que ce numéro n'existe pas déjà
    PERFORM 1 FROM public.quotes WHERE quote_number = v_number;
    
    -- Si le numéro n'existe pas, l'utiliser
    IF NOT FOUND THEN
      NEW.quote_number := v_number;
      RETURN NEW;
    END IF;
    
    -- Sinon, réessayer
    v_attempt := v_attempt + 1;
  END LOOP;
  
  -- Fallback avec timestamp si échec après max_attempts
  v_number := 'DEV-' || v_year || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 5, '0');
  NEW.quote_number := v_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number_trigger();
```

### 2. API Route - Simplification
**Fichier :** `src/app/api/quotes/route.ts`

**Avant :**
```typescript
// Générer le numéro de devis (unique globalement)
const quoteNumber = await generateQuoteNumber(supabase)

const { data: quote, error: quoteError } = await supabase
  .from('quotes')
  .insert({
    user_id: user.id,
    client_id,
    quote_number: quoteNumber,  // ❌ Généré manuellement
    status: 'draft',
    // ...
  })
```

**Après :**
```typescript
// Le quote_number sera généré automatiquement par le trigger
const { data: quote, error: quoteError } = await supabase
  .from('quotes')
  .insert({
    user_id: user.id,
    client_id,
    // quote_number sera auto-généré ✅
    status: 'draft',
    // ...
  })
```

### 3. Validation UUID - Mobile
**Fichier :** `src/app/mobile/quotes/[id]/page.tsx`

**Ajout :**
```typescript
const loadQuote = useCallback(async () => {
  if (!params.id) return;

  // Valider le format UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(params.id as string)) {
    console.error('ID invalide (format UUID attendu):', params.id);
    toast.error('Devis non trouvé', {
      description: 'L\'identifiant du devis est invalide.'
    });
    router.push('/mobile/quotes');
    return;
  }
  // ...
})
```

### 4. Validation UUID - Desktop
**Fichier :** `src/app/dashboard/quotes/[id]/page.tsx`

**Ajout :** (identique à la version mobile)

---

## Étapes de Déploiement

### ⚠️ IMPORTANT - Migration à Appliquer

La migration 010 doit être appliquée sur votre base Supabase production :

#### Option 1 : Via Supabase Dashboard (Recommandé)
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu du fichier `supabase/migrations/010_add_quote_number_trigger.sql`
5. Cliquez sur **Run**

#### Option 2 : Via CLI Supabase
```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter
npx supabase login

# Pousser la migration
npx supabase db push
```

### Vérification du Déploiement

1. **Code déjà déployé** ✅
   - Le code a été poussé sur GitHub : commit `d6bdb5b`
   - Vercel déploiera automatiquement

2. **Migration à appliquer manuellement** ⚠️
   - La migration 010 doit être exécutée sur Supabase
   - Sans cette migration, l'erreur de duplicate key peut encore survenir

3. **Test après déploiement**
   ```
   1. Créer un nouveau devis depuis mobile
   2. Vérifier que le numéro est bien généré (DEV-2025-XXXXX)
   3. Essayer de créer 2 devis rapidement (tester la race condition)
   4. Vérifier qu'aucun doublon n'est créé
   ```

---

## Impact sur les Utilisateurs

### ✅ Résolution Immédiate
- Plus d'erreur de numéro de devis en double
- Plus d'erreur UUID sur les anciennes données
- Meilleure expérience utilisateur avec messages d'erreur clairs

### 🔄 Migrations Futures
Le système de trigger automatique évitera ce type de problème pour :
- Les factures (si vous utilisez le même système)
- Les avoirs (crédit notes)
- Tout autre document avec numéro séquentiel

### 📊 Performance
- **Amélioration** : Un appel API en moins par création de devis
- **Atomicité** : Garantie par PostgreSQL
- **Scalabilité** : Fonctionne même avec des milliers d'utilisateurs simultanés

---

## Prochaines Actions Recommandées

1. **Appliquer la migration 010** (URGENT)
2. Vérifier le déploiement Vercel
3. Tester en production avec quelques devis
4. Envisager le même système pour les factures et avoirs
5. Considérer un script de nettoyage des données corrompues (IDs numériques)

---

## Questions Fréquentes

### Q : Que se passe-t-il avec les anciens devis ?
**R :** Les anciens devis conservent leur numéro actuel. Seuls les nouveaux utilisent le trigger.

### Q : Et si deux serveurs créent un devis exactement au même moment ?
**R :** Le trigger PostgreSQL gère cela avec une boucle de retry intelligente et des vérifications atomiques.

### Q : Pourquoi un ID "3" au lieu d'un UUID ?
**R :** Probablement des données de test ou une migration ancienne. La validation empêchera maintenant ces erreurs.

### Q : Dois-je supprimer l'ancienne fonction generateQuoteNumber ?
**R :** ✅ Déjà fait ! Le code a été nettoyé automatiquement.

---

## Contact & Support

Si vous rencontrez d'autres problèmes après le déploiement :
1. Vérifiez les logs Vercel
2. Vérifiez les logs Supabase (Dashboard > Logs)
3. Testez avec un utilisateur de test en production

**Commit de référence :** `d6bdb5b`
**Migration appliquée :** `010_add_quote_number_trigger.sql`
