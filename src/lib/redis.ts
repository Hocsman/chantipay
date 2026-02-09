/**
 * Redis Client & Rate Limiting Module
 * 
 * Utilise Upstash Redis pour:
 * - Rate limiting distribué (fonctionne en serverless)
 * - Cache des réponses IA
 * - Cache des suggestions de prix
 * 
 * FALLBACK: Si Redis non configuré, utilise un store en mémoire (dev only)
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// ===========================================
// Redis Client Singleton
// ===========================================

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[Redis] UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN non configuré - mode fallback mémoire')
    return null
  }

  try {
    redisClient = new Redis({ url, token })
    return redisClient
  } catch (error) {
    console.error('[Redis] Erreur connexion:', error)
    return null
  }
}

// ===========================================
// Rate Limiters
// ===========================================

// Configuration des limites par action
export const RATE_LIMIT_CONFIG = {
  // APIs IA (coûteuses)
  'ai:generate-quote': { requests: 10, window: '10m' as const },
  'ai:analyze-photo': { requests: 5, window: '10m' as const },
  'ai:generate-variants': { requests: 5, window: '10m' as const },
  'ai:smart-edit': { requests: 10, window: '10m' as const },
  'ai:suggest-complements': { requests: 15, window: '10m' as const },
  'ai:visit-report': { requests: 5, window: '10m' as const },
  
  // Auth & Contact
  'auth:login': { requests: 5, window: '15m' as const },
  'auth:register': { requests: 3, window: '1h' as const },
  'contact': { requests: 5, window: '10m' as const },
  
  // Default
  'default': { requests: 30, window: '1m' as const },
} as const

export type RateLimitAction = keyof typeof RATE_LIMIT_CONFIG

// Cache des rate limiters
const rateLimiters = new Map<RateLimitAction, Ratelimit>()

// Fallback en mémoire pour dev sans Redis
const memoryStore = new Map<string, { count: number; resetTime: number }>()

function getOrCreateRateLimiter(action: RateLimitAction): Ratelimit | null {
  const redis = getRedisClient()
  if (!redis) return null

  if (rateLimiters.has(action)) {
    return rateLimiters.get(action)!
  }

  const config = RATE_LIMIT_CONFIG[action] || RATE_LIMIT_CONFIG.default
  
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `chantipay:ratelimit:${action}`,
    analytics: true,
  })

  rateLimiters.set(action, limiter)
  return limiter
}

/**
 * Vérifier le rate limit pour une action
 * Utilise Redis si disponible, sinon fallback mémoire
 */
export async function checkRateLimit(
  identifier: string,
  action: RateLimitAction
): Promise<{
  success: boolean
  remaining: number
  reset?: number
  retryAfter?: number
}> {
  const limiter = getOrCreateRateLimiter(action)

  // Utiliser Redis si disponible
  if (limiter) {
    try {
      const result = await limiter.limit(identifier)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      }
    } catch (error) {
      console.error('[RateLimit] Erreur Redis, fallback mémoire:', error)
      // Fallback to memory on Redis error
    }
  }

  // Fallback: rate limiting en mémoire
  return checkMemoryRateLimit(identifier, action)
}

function checkMemoryRateLimit(
  identifier: string,
  action: RateLimitAction
): { success: boolean; remaining: number; retryAfter?: number } {
  const config = RATE_LIMIT_CONFIG[action] || RATE_LIMIT_CONFIG.default
  const windowMs = parseWindowToMs(config.window)
  const key = `${action}:${identifier}`
  const now = Date.now()

  const record = memoryStore.get(key)

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: config.requests - 1 }
  }

  if (record.count >= config.requests) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { success: true, remaining: config.requests - record.count }
}

function parseWindowToMs(window: string): number {
  const value = parseInt(window)
  if (window.endsWith('m')) return value * 60 * 1000
  if (window.endsWith('h')) return value * 60 * 60 * 1000
  if (window.endsWith('s')) return value * 1000
  return value * 1000
}

// Nettoyage périodique du store mémoire
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 60 * 1000)
}

// ===========================================
// Cache Module
// ===========================================

const CACHE_PREFIXES = {
  aiResponse: 'chantipay:cache:ai:',
  priceHint: 'chantipay:cache:price:',
} as const

/**
 * Récupérer une valeur du cache
 */
export async function getFromCache<T>(
  prefix: keyof typeof CACHE_PREFIXES,
  key: string
): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    const fullKey = CACHE_PREFIXES[prefix] + key
    const cached = await redis.get<T>(fullKey)
    return cached
  } catch (error) {
    console.error('[Cache] Erreur lecture:', error)
    return null
  }
}

/**
 * Stocker une valeur dans le cache
 */
export async function setInCache<T>(
  prefix: keyof typeof CACHE_PREFIXES,
  key: string,
  value: T,
  ttlSeconds: number = 3600 // 1 heure par défaut
): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false

  try {
    const fullKey = CACHE_PREFIXES[prefix] + key
    await redis.set(fullKey, value, { ex: ttlSeconds })
    return true
  } catch (error) {
    console.error('[Cache] Erreur écriture:', error)
    return false
  }
}

/**
 * Supprimer une valeur du cache
 */
export async function deleteFromCache(
  prefix: keyof typeof CACHE_PREFIXES,
  key: string
): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false

  try {
    const fullKey = CACHE_PREFIXES[prefix] + key
    await redis.del(fullKey)
    return true
  } catch (error) {
    console.error('[Cache] Erreur suppression:', error)
    return false
  }
}

/**
 * Générer une clé de cache unique basée sur les paramètres
 */
export function generateCacheKey(params: Record<string, unknown>): string {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join('|')
  
  // Hash simple pour raccourcir la clé
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// ===========================================
// 🔒 VERROUS DISTRIBUÉS (Distributed Locks)
// Évite les doubles soumissions de devis/factures
// ===========================================

const LOCK_PREFIX = 'chantipay:lock:'
const memoryLocks = new Map<string, number>()

export interface LockResult {
  acquired: boolean
  lockKey: string
  release: () => Promise<void>
}

/**
 * Acquérir un verrou distribué
 * Utile pour éviter les doubles créations (devis, factures, paiements)
 * 
 * @param resource - Identifiant unique (ex: 'quote:user123', 'invoice:abc')
 * @param ttlSeconds - Durée max du verrou (sécurité si crash)
 * @returns LockResult avec fonction release()
 * 
 * @example
 * const lock = await acquireLock(`quote:${userId}`, 30)
 * if (!lock.acquired) {
 *   return { error: 'Création déjà en cours' }
 * }
 * try {
 *   // Créer le devis...
 * } finally {
 *   await lock.release()
 * }
 */
export async function acquireLock(
  resource: string,
  ttlSeconds: number = 30
): Promise<LockResult> {
  const lockKey = LOCK_PREFIX + resource
  const lockValue = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  
  const redis = getRedisClient()
  
  if (redis) {
    try {
      // SET NX = Set if Not eXists (atomique)
      const acquired = await redis.set(lockKey, lockValue, { 
        nx: true, 
        ex: ttlSeconds 
      })
      
      return {
        acquired: acquired === 'OK',
        lockKey,
        release: async () => {
          // Ne libérer que si c'est notre verrou (évite de libérer le verrou d'un autre)
          const currentValue = await redis.get(lockKey)
          if (currentValue === lockValue) {
            await redis.del(lockKey)
          }
        }
      }
    } catch (error) {
      console.error('[Lock] Erreur Redis:', error)
    }
  }
  
  // Fallback mémoire
  const now = Date.now()
  const existingLock = memoryLocks.get(lockKey)
  
  if (existingLock && existingLock > now) {
    return {
      acquired: false,
      lockKey,
      release: async () => {}
    }
  }
  
  memoryLocks.set(lockKey, now + (ttlSeconds * 1000))
  
  return {
    acquired: true,
    lockKey,
    release: async () => {
      memoryLocks.delete(lockKey)
    }
  }
}

/**
 * Exécuter une fonction avec verrou automatique
 * Le verrou est libéré automatiquement après exécution
 */
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 30
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const lock = await acquireLock(resource, ttlSeconds)
  
  if (!lock.acquired) {
    return { success: false, error: 'Opération déjà en cours, veuillez patienter' }
  }
  
  try {
    const data = await fn()
    return { success: true, data }
  } finally {
    await lock.release()
  }
}

// ===========================================
// 📊 COMPTEURS & ANALYTICS
// Suivi d'utilisation et quotas
// ===========================================

const COUNTER_PREFIX = 'chantipay:counter:'
const STATS_PREFIX = 'chantipay:stats:'
const memoryCounters = new Map<string, number>()

/**
 * Incrémenter un compteur
 * Utile pour : nombre de devis créés, appels IA, etc.
 */
export async function incrementCounter(
  name: string,
  by: number = 1
): Promise<number> {
  const redis = getRedisClient()
  const key = COUNTER_PREFIX + name
  
  if (redis) {
    try {
      const newValue = await redis.incrby(key, by)
      return newValue
    } catch (error) {
      console.error('[Counter] Erreur Redis:', error)
    }
  }
  
  // Fallback mémoire
  const current = memoryCounters.get(key) || 0
  const newValue = current + by
  memoryCounters.set(key, newValue)
  return newValue
}

/**
 * Obtenir la valeur d'un compteur
 */
export async function getCounter(name: string): Promise<number> {
  const redis = getRedisClient()
  const key = COUNTER_PREFIX + name
  
  if (redis) {
    try {
      const value = await redis.get<number>(key)
      return value || 0
    } catch (error) {
      console.error('[Counter] Erreur lecture:', error)
    }
  }
  
  return memoryCounters.get(key) || 0
}

/**
 * Compteur journalier avec expiration automatique
 * Parfait pour les quotas quotidiens
 */
export async function incrementDailyCounter(
  userId: string,
  action: string,
  by: number = 1
): Promise<{ count: number; date: string }> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const key = `${STATS_PREFIX}daily:${userId}:${action}:${today}`
  
  const redis = getRedisClient()
  
  if (redis) {
    try {
      const count = await redis.incrby(key, by)
      // Expire à minuit + 1 jour (garde les stats jusqu'au lendemain)
      await redis.expire(key, 48 * 60 * 60)
      return { count, date: today }
    } catch (error) {
      console.error('[DailyCounter] Erreur:', error)
    }
  }
  
  // Fallback
  const current = memoryCounters.get(key) || 0
  const newValue = current + by
  memoryCounters.set(key, newValue)
  return { count: newValue, date: today }
}

/**
 * Obtenir les stats d'utilisation d'un utilisateur
 */
export async function getUserDailyStats(
  userId: string,
  actions: string[]
): Promise<Record<string, number>> {
  const today = new Date().toISOString().split('T')[0]
  const stats: Record<string, number> = {}
  
  const redis = getRedisClient()
  
  for (const action of actions) {
    const key = `${STATS_PREFIX}daily:${userId}:${action}:${today}`
    
    if (redis) {
      try {
        const value = await redis.get<number>(key)
        stats[action] = value || 0
      } catch {
        stats[action] = 0
      }
    } else {
      stats[action] = memoryCounters.get(key) || 0
    }
  }
  
  return stats
}

// ===========================================
// 📋 FILE D'ATTENTE (Job Queue)
// Tâches async : PDF, emails, rappels
// ===========================================

const QUEUE_PREFIX = 'chantipay:queue:'
const memoryQueues = new Map<string, Array<{ id: string; data: unknown; addedAt: number }>>()

export interface Job<T = unknown> {
  id: string
  data: T
  addedAt: number
  attempts?: number
  lastError?: string
}

/**
 * Ajouter un job à la file d'attente
 * 
 * @example
 * await enqueue('pdf-generation', {
 *   type: 'quote',
 *   quoteId: 'abc123',
 *   userId: 'user456'
 * })
 */
export async function enqueue<T>(
  queueName: string,
  data: T
): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const job: Job<T> = {
    id: jobId,
    data,
    addedAt: Date.now(),
    attempts: 0
  }
  
  const redis = getRedisClient()
  const key = QUEUE_PREFIX + queueName
  
  if (redis) {
    try {
      await redis.rpush(key, JSON.stringify(job))
      return jobId
    } catch (error) {
      console.error('[Queue] Erreur ajout:', error)
    }
  }
  
  // Fallback mémoire
  if (!memoryQueues.has(queueName)) {
    memoryQueues.set(queueName, [])
  }
  memoryQueues.get(queueName)!.push({ id: jobId, data, addedAt: Date.now() })
  return jobId
}

/**
 * Récupérer le prochain job de la file (FIFO)
 * Retire le job de la file
 */
export async function dequeue<T>(queueName: string): Promise<Job<T> | null> {
  const redis = getRedisClient()
  const key = QUEUE_PREFIX + queueName
  
  if (redis) {
    try {
      const jobStr = await redis.lpop<string>(key)
      if (!jobStr) return null
      return JSON.parse(jobStr) as Job<T>
    } catch (error) {
      console.error('[Queue] Erreur dequeue:', error)
    }
  }
  
  // Fallback mémoire
  const queue = memoryQueues.get(queueName)
  if (!queue || queue.length === 0) return null
  
  const job = queue.shift()!
  return job as unknown as Job<T>
}

/**
 * Voir le nombre de jobs en attente
 */
export async function getQueueLength(queueName: string): Promise<number> {
  const redis = getRedisClient()
  const key = QUEUE_PREFIX + queueName
  
  if (redis) {
    try {
      return await redis.llen(key)
    } catch (error) {
      console.error('[Queue] Erreur lecture longueur:', error)
    }
  }
  
  return memoryQueues.get(queueName)?.length || 0
}

/**
 * Voir tous les jobs en attente (sans les retirer)
 */
export async function peekQueue<T>(
  queueName: string,
  limit: number = 10
): Promise<Job<T>[]> {
  const redis = getRedisClient()
  const key = QUEUE_PREFIX + queueName
  
  if (redis) {
    try {
      const jobs = await redis.lrange(key, 0, limit - 1)
      return jobs.map(j => typeof j === 'string' ? JSON.parse(j) : j) as Job<T>[]
    } catch (error) {
      console.error('[Queue] Erreur peek:', error)
    }
  }
  
  // Fallback mémoire
  const queue = memoryQueues.get(queueName) || []
  return queue.slice(0, limit) as unknown as Job<T>[]
}

// Queues prédéfinies pour ChantiPay
export const QUEUES = {
  PDF_GENERATION: 'pdf-generation',
  EMAIL_SEND: 'email-send',
  QUOTE_REMINDER: 'quote-reminder',
  INVOICE_REMINDER: 'invoice-reminder',
  ANALYTICS_EVENT: 'analytics-event',
} as const

// ===========================================
// 📈 STATS GLOBALES (Admin Dashboard)
// ===========================================

/**
 * Obtenir un résumé des statistiques Redis
 * Utile pour un dashboard admin
 */
export async function getRedisStats(): Promise<{
  connected: boolean
  queues: Record<string, number>
  counters: Record<string, number>
}> {
  const redis = getRedisClient()
  const connected = redis !== null
  
  const queues: Record<string, number> = {}
  const counters: Record<string, number> = {}
  
  if (connected && redis) {
    try {
      // Stats des queues
      for (const queueName of Object.values(QUEUES)) {
        queues[queueName] = await getQueueLength(queueName)
      }
      
      // Compteurs globaux
      const counterKeys = [
        'quotes:created:total',
        'invoices:created:total',
        'ai:calls:total',
        'emails:sent:total'
      ]
      
      for (const key of counterKeys) {
        counters[key] = await getCounter(key)
      }
    } catch (error) {
      console.error('[Stats] Erreur lecture stats:', error)
    }
  }
  
  return { connected, queues, counters }
}

// ===========================================
// 🔄 ANTI-DOUBLE-CLIC (Idempotency)
// Empêche les actions dupliquées
// ===========================================

const IDEMPOTENCY_PREFIX = 'chantipay:idempotency:'

/**
 * Vérifier si une requête a déjà été traitée (idempotency)
 * Retourne le résultat précédent si déjà traité
 * 
 * @param key - Clé unique (ex: hash de la requête)
 * @param ttlSeconds - Durée de vie du résultat en cache
 */
export async function checkIdempotency<T>(
  key: string
): Promise<T | null> {
  const redis = getRedisClient()
  const fullKey = IDEMPOTENCY_PREFIX + key
  
  if (redis) {
    try {
      const cached = await redis.get<T>(fullKey)
      return cached
    } catch (error) {
      console.error('[Idempotency] Erreur lecture:', error)
    }
  }
  
  return null
}

/**
 * Sauvegarder le résultat d'une requête pour idempotency
 */
export async function saveIdempotencyResult<T>(
  key: string,
  result: T,
  ttlSeconds: number = 300 // 5 minutes par défaut
): Promise<void> {
  const redis = getRedisClient()
  const fullKey = IDEMPOTENCY_PREFIX + key
  
  if (redis) {
    try {
      await redis.set(fullKey, result, { ex: ttlSeconds })
    } catch (error) {
      console.error('[Idempotency] Erreur sauvegarde:', error)
    }
  }
}

/**
 * Helper pour exécuter une fonction de manière idempotente
 * Si déjà exécuté avec cette clé, retourne le résultat précédent
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Vérifier si déjà traité
  const cached = await checkIdempotency<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Exécuter et sauvegarder
  const result = await fn()
  await saveIdempotencyResult(key, result, ttlSeconds)
  return result
}

// ===========================================
// Export Redis Client pour usage direct
// ===========================================
export { getRedisClient }
