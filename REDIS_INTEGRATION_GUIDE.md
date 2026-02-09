# 🚀 Guide d'intégration Redis - ChantiPay

## Fonctionnalités implémentées

Les fonctionnalités suivantes sont **prêtes à l'emploi** dans `src/lib/redis.ts` :

### 1. 🔒 Verrous distribués (Protection double-clic)
### 2. 📊 Compteurs & Analytics  
### 3. 📋 File d'attente (Jobs async)
### 4. 🔄 Idempotency (Anti-duplication)

---

## ✅ Comment les utiliser ?

### 1. Protection contre les doubles créations (devis, factures, paiements)

**Dans `/api/quotes/route.ts`** :

```typescript
import { withLock, incrementCounter, incrementDailyCounter } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 🔒 Ajouter cette ligne AVANT de créer le devis
  const lockResult = await withLock(
    `create-quote:${user.id}`,
    async () => {
      // TON CODE EXISTANT ICI (création devis)
      const quote = await createQuote(...)
      
      // 📊 Incrémenter les compteurs
      await Promise.all([
        incrementCounter('quotes:created:total'),
        incrementDailyCounter(user.id, 'quotes')
      ])
      
      return quote
    },
    30 // Durée max du verrou (30s)
  )
  
  // Vérifier le résultat
  if (!lockResult.success) {
    return NextResponse.json(
      { error: lockResult.error }, // "Opération déjà en cours"
      { status: 409 }
    )
  }
  
  return NextResponse.json({ quote: lockResult.data })
}
```

**Même principe pour les factures** (`/api/invoices/route.ts`) :

```typescript
const lockResult = await withLock(
  `create-invoice:${user.id}`,
  async () => {
    // Créer la facture
    const invoice = await createInvoice(...)
    
    // Analytics
    await incrementCounter('invoices:created:total')
    await incrementDailyCounter(user.id, 'invoices')
    
    return invoice
  }
)
```

---

### 2. Quotas utilisateur (limites par plan)

**Dans `/api/ai/generate-quote/route.ts`** :

```typescript
import { getUserDailyStats } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const { user } = await authenticateUser()
  
  // Vérifier le quota
  const stats = await getUserDailyStats(user.id, ['ai-calls'])
  const userPlan = getUserPlan(user) // 'free' | 'pro' | 'enterprise'
  
  const limits = {
    free: 10,
    pro: 100,
    enterprise: 1000
  }
  
  if (stats['ai-calls'] >= limits[userPlan]) {
    return NextResponse.json(
      { error: `Quota IA atteint (${limits[userPlan]}/jour)` },
      { status: 429 }
    )
  }
  
  // Appeler l'IA
  const result = await generateQuote(...)
  
  // Incrémenter le compteur
  await incrementDailyCounter(user.id, 'ai-calls')
  
  return NextResponse.json(result)
}
```

---

### 3. File d'attente pour génération PDF

**Ajouter un job à la queue** :

```typescript
import { enqueue, QUEUES } from '@/lib/redis'

// Quand un utilisateur demande un PDF
export async function POST(request: NextRequest) {
  const { quoteId, userId } = await request.json()
  
  // Ajouter à la file d'attente
  const jobId = await enqueue(QUEUES.PDF_GENERATION, {
    type: 'quote',
    quoteId,
    userId,
    email: user.email // Pour envoyer par email quand prêt
  })
  
  return NextResponse.json({
    message: 'PDF en cours de génération',
    jobId
  })
}
```

**Worker pour traiter la queue** (`/api/cron/process-pdf/route.ts`) :

```typescript
import { dequeue, enqueue, QUEUES } from '@/lib/redis'

export async function GET() {
  let processed = 0
  
  // Traiter jusqu'à 10 PDFs
  for (let i = 0; i < 10; i++) {
    const job = await dequeue(QUEUES.PDF_GENERATION)
    if (!job) break
    
    try {
      // Générer le PDF
      const pdf = await generatePDF(job.data.quoteId)
      
      // Envoyer par email si demandé
      if (job.data.email) {
        await enqueue(QUEUES.EMAIL_SEND, {
          to: job.data.email,
          subject: 'Votre devis PDF est prêt',
          pdf
        })
      }
      
      processed++
    } catch (error) {
      console.error('Erreur PDF:', error)
      // Optionnel : re-enqueue pour retry
    }
  }
  
  return NextResponse.json({ processed })
}
```

---

### 4. Empêcher les doubles paiements

**Dans `/api/payments/create/route.ts`** :

```typescript
import { withIdempotency } from '@/lib/redis'

export async function POST(request: NextRequest) {
  const { invoiceId, amount } = await request.json()
  
  // Générer une clé unique basée sur la requête
  const idempotencyKey = `payment:${invoiceId}:${amount}`
  
  // Si déjà traité, retourne le résultat précédent
  const result = await withIdempotency(
    idempotencyKey,
    async () => {
      // Traiter le paiement
      const payment = await stripeClient.charge(...)
      return payment
    },
    3600 // Garder le résultat 1h
  )
  
  return NextResponse.json(result)
}
```

---

### 5. Dashboard admin (stats Redis)

**Dans `/api/admin/stats/route.ts`** :

```typescript
import { getRedisStats, getCounter, getUserDailyStats } from '@/lib/redis'

export async function GET() {
  const stats = await getRedisStats()
  
  return NextResponse.json({
    redis: {
      connected: stats.connected,
      queues: {
        pdfPending: stats.queues[QUEUES.PDF_GENERATION] || 0,
        emailsPending: stats.queues[QUEUES.EMAIL_SEND] || 0,
      }
    },
    totals: {
      quotesCreated: stats.counters['quotes:created:total'] || 0,
      invoicesCreated: stats.counters['invoices:created:total'] || 0,
      aiCalls: stats.counters['ai:calls:total'] || 0,
    }
  })
}
```

---

## 📋 Checklist d'intégration

- [ ] **Devis** : Ajouter `withLock` dans `/api/quotes/route.ts`
- [ ] **Factures** : Ajouter `withLock` dans `/api/invoices/route.ts`
- [ ] **Quotas IA** : Vérifier `getUserDailyStats` dans les routes AI
- [ ] **PDF Queue** : Mettre les générations PDF en queue
- [ ] **Email Queue** : Mettre les emails en queue
- [ ] **Paiements** : Ajouter `withIdempotency` sur les paiements
- [ ] **Dashboard** : Créer `/api/admin/stats` avec `getRedisStats()`

---

## 🔧 Variables d'environnement

Redis fonctionne **automatiquement en mode fallback mémoire** si les variables ne sont pas configurées.

Pour activer Redis en production :

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxYourTokenxxx
```

---

## 💡 Exemples complets

Tous les exemples d'utilisation sont dans **`src/lib/redis-examples.ts`**.

---

## 🚀 Prochaines étapes

1. **Tester en local** : Les fonctions fonctionnent en mode mémoire sans Redis
2. **Intégrer dans tes routes** : Copier-coller les exemples ci-dessus
3. **Déployer** : Configurer Upstash Redis pour la prod
4. **Monitorer** : Créer le dashboard admin

Besoin d'aide pour intégrer ? Ping-moi ! 🎯
