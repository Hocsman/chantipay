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
// Export Redis Client pour usage direct
// ===========================================
export { getRedisClient }
