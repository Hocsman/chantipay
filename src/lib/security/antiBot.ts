/**
 * Anti-Bot Security Utilities
 * 
 * Multiple layers of protection against automated submissions:
 * 1. Honeypot fields (hidden fields that bots fill)
 * 2. Time-based validation (forms submitted too fast are suspicious)
 * 3. Rate limiting by IP
 */

// ===========================================
// Honeypot Validation
// ===========================================

/**
 * Check if honeypot field was filled (bots often fill all fields)
 * @param honeypotValue - Value of the hidden honeypot field
 * @returns true if the submission looks like a bot
 */
export function isHoneypotTriggered(honeypotValue?: string): boolean {
  return !!honeypotValue && honeypotValue.length > 0
}

// ===========================================
// Time-based Validation
// ===========================================

const MIN_FORM_SUBMISSION_TIME_MS = 3000 // 3 seconds minimum
const MAX_FORM_SUBMISSION_TIME_MS = 30 * 60 * 1000 // 30 minutes maximum

/**
 * Validate that form wasn't submitted too quickly (bot) or too slowly (token expired)
 * @param formLoadedAt - Timestamp when form was loaded
 * @returns { valid: boolean, reason?: string }
 */
export function validateSubmissionTime(formLoadedAt: number): { 
  valid: boolean
  reason?: string 
} {
  const now = Date.now()
  const elapsed = now - formLoadedAt

  if (elapsed < MIN_FORM_SUBMISSION_TIME_MS) {
    return { 
      valid: false, 
      reason: 'Formulaire soumis trop rapidement. Veuillez patienter quelques secondes.' 
    }
  }

  if (elapsed > MAX_FORM_SUBMISSION_TIME_MS) {
    return { 
      valid: false, 
      reason: 'Session expirée. Veuillez rafraîchir la page et réessayer.' 
    }
  }

  return { valid: true }
}

/**
 * Encode a timestamp for form submission
 */
export function encodeTimestamp(timestamp: number): string {
  // Simple obfuscation: base64 encode the timestamp with a salt
  const salt = 'cp_' // ChantiPay prefix
  return btoa(`${salt}${timestamp}`)
}

/**
 * Decode a timestamp from form submission
 */
export function decodeTimestamp(encoded: string): number | null {
  try {
    const decoded = atob(encoded)
    const timestamp = parseInt(decoded.replace('cp_', ''), 10)
    if (isNaN(timestamp)) return null
    return timestamp
  } catch {
    return null
  }
}

// ===========================================
// Rate Limiting
// ===========================================

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked: boolean
  blockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Config for different actions
export const RATE_LIMIT_CONFIG = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3, blockDurationMs: 60 * 60 * 1000 },
  contact: { windowMs: 10 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 },
  quote: { windowMs: 60 * 1000, maxRequests: 10, blockDurationMs: 5 * 60 * 1000 },
} as const

type RateLimitAction = keyof typeof RATE_LIMIT_CONFIG

/**
 * Check rate limit for an action
 * @param identifier - IP address or user ID
 * @param action - The action being performed
 * @returns { allowed: boolean, remaining: number, retryAfter?: number }
 */
export function checkRateLimit(
  identifier: string,
  action: RateLimitAction
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const config = RATE_LIMIT_CONFIG[action]
  const key = `${action}:${identifier}`
  const now = Date.now()
  
  const record = rateLimitStore.get(key)

  // Check if blocked
  if (record?.blocked && record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    }
  }

  // Reset if window expired or was blocked but block expired
  if (!record || now > record.resetTime || (record.blocked && (!record.blockedUntil || now >= record.blockedUntil))) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    })
    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    // Block the identifier
    record.blocked = true
    record.blockedUntil = now + config.blockDurationMs
    rateLimitStore.set(key, record)
    
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
    }
  }

  // Increment counter
  record.count++
  rateLimitStore.set(key, record)
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

// ===========================================
// Combined Anti-Bot Check
// ===========================================

export interface AntiBotCheckResult {
  passed: boolean
  reason?: string
  isBot: boolean
}

/**
 * Perform all anti-bot checks
 */
export function performAntiBotChecks(params: {
  honeypot?: string
  formLoadedAt?: number
  ip: string
  action: RateLimitAction
}): AntiBotCheckResult {
  const { honeypot, formLoadedAt, ip, action } = params

  // 1. Honeypot check
  if (isHoneypotTriggered(honeypot)) {
    console.log(`[ANTI-BOT] Honeypot triggered for IP: ${ip}`)
    return { passed: false, reason: 'Requête invalide', isBot: true }
  }

  // 2. Time validation (if provided)
  if (formLoadedAt) {
    const timeCheck = validateSubmissionTime(formLoadedAt)
    if (!timeCheck.valid) {
      console.log(`[ANTI-BOT] Time validation failed for IP: ${ip} - ${timeCheck.reason}`)
      const isTooFast = (Date.now() - formLoadedAt) < MIN_FORM_SUBMISSION_TIME_MS
      return { passed: false, reason: timeCheck.reason, isBot: isTooFast }
    }
  }

  // 3. Rate limit check
  const rateLimit = checkRateLimit(ip, action)
  if (!rateLimit.allowed) {
    console.log(`[ANTI-BOT] Rate limit exceeded for IP: ${ip}, action: ${action}`)
    return {
      passed: false,
      reason: `Trop de tentatives. Réessayez dans ${rateLimit.retryAfter} secondes.`,
      isBot: false,
    }
  }

  return { passed: true, isBot: false }
}

// Cleanup old entries periodically (in serverless, this helps with memory)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      // Remove if window expired and not blocked, or block expired
      if (now > record.resetTime && (!record.blocked || (record.blockedUntil && now > record.blockedUntil))) {
        rateLimitStore.delete(key)
      }
    }
  }, 60 * 1000)
}
