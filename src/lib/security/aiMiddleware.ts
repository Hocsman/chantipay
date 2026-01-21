/**
 * Middleware de sécurité pour les APIs IA
 * 
 * Fournit:
 * - Authentification Supabase (obligatoire ou optionnelle)
 * - Rate limiting via Redis/Upstash
 * - Validation des entrées
 * - Logging des erreurs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, type RateLimitAction } from '@/lib/redis'

// ===========================================
// Types
// ===========================================

export interface AIRequestContext {
  user: {
    id: string
    email?: string
  } | null
  ip: string
  rateLimitRemaining: number
}

interface SecureAIOptions {
  /** Action pour le rate limiting */
  action: RateLimitAction
  /** Authentification requise (défaut: true) */
  requireAuth?: boolean
  /** Autoriser les utilisateurs non authentifiés avec rate limit plus strict */
  allowAnonymous?: boolean
}

type AIHandler<T> = (
  request: NextRequest,
  context: AIRequestContext,
  body: T
) => Promise<NextResponse>

// ===========================================
// Utilitaires
// ===========================================

/**
 * Obtenir l'IP du client depuis les headers
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (cfIP) return cfIP
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP

  return '127.0.0.1'
}

/**
 * Créer une réponse d'erreur formatée
 */
function errorResponse(
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...details,
    },
    { status }
  )
}

// ===========================================
// Wrapper principal
// ===========================================

/**
 * Wrapper sécurisé pour les handlers d'API IA
 * Gère auth, rate limit et validation automatiquement
 */
export function withAISecurity<T = unknown>(
  options: SecureAIOptions,
  handler: AIHandler<T>
) {
  const { action, requireAuth = true, allowAnonymous = false } = options

  return async (request: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(request)

    try {
      // 1. Vérifier l'authentification
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (requireAuth && !allowAnonymous && (!user || authError)) {
        return errorResponse('Authentification requise', 401)
      }

      // 2. Déterminer l'identifiant pour le rate limit
      // Utilisateurs authentifiés: userId, sinon IP
      const rateLimitId = user?.id || `anon:${ip}`

      // 3. Vérifier le rate limit
      const rateLimit = await checkRateLimit(rateLimitId, action)

      if (!rateLimit.success) {
        return errorResponse(
          'Trop de requêtes. Veuillez patienter.',
          429,
          {
            retryAfter: rateLimit.retryAfter,
            remaining: 0,
          }
        )
      }

      // 4. Parser le body (pour POST/PUT/PATCH)
      let body: T = {} as T
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          body = await request.json()
        } catch {
          return errorResponse('Corps de requête invalide', 400)
        }
      }

      // 5. Créer le contexte
      const context: AIRequestContext = {
        user: user ? { id: user.id, email: user.email } : null,
        ip,
        rateLimitRemaining: rateLimit.remaining,
      }

      // 6. Appeler le handler
      const response = await handler(request, context, body)

      // 7. Ajouter les headers de rate limit
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      if (rateLimit.reset) {
        response.headers.set('X-RateLimit-Reset', rateLimit.reset.toString())
      }

      return response
    } catch (error) {
      console.error(`[AI API] Erreur ${action}:`, error)
      return errorResponse('Erreur serveur interne', 500)
    }
  }
}

// ===========================================
// Validation d'images
// ===========================================

/**
 * Valider qu'une image base64 est valide et sécurisée
 */
export function validateImageBase64(
  base64: string,
  options?: {
    maxSizeBytes?: number
    allowedMimeTypes?: string[]
  }
): { valid: boolean; error?: string; mimeType?: string } {
  const { maxSizeBytes = 10 * 1024 * 1024, allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options || {}

  // Vérifier le format data URL
  const dataUrlMatch = base64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!dataUrlMatch) {
    return { valid: false, error: 'Format d\'image invalide. Utilisez le format data:image/...;base64,...' }
  }

  const [, mimeType, data] = dataUrlMatch

  // Vérifier le type MIME
  if (!allowedMimeTypes.includes(mimeType)) {
    return { 
      valid: false, 
      error: `Type d'image non autorisé: ${mimeType}. Types acceptés: ${allowedMimeTypes.join(', ')}` 
    }
  }

  // Décoder et vérifier la taille
  try {
    const decoded = Buffer.from(data, 'base64')
    
    if (decoded.length > maxSizeBytes) {
      return { 
        valid: false, 
        error: `Image trop volumineuse: ${(decoded.length / 1024 / 1024).toFixed(1)}MB. Maximum: ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB` 
      }
    }

    // Vérifier les magic bytes pour confirmer le type réel
    const realMimeType = detectImageMimeType(decoded)
    if (!realMimeType) {
      return { valid: false, error: 'Contenu de l\'image invalide ou corrompu' }
    }

    if (!allowedMimeTypes.includes(realMimeType)) {
      return { 
        valid: false, 
        error: `Le contenu réel de l'image (${realMimeType}) ne correspond pas au type déclaré (${mimeType})` 
      }
    }

    return { valid: true, mimeType: realMimeType }
  } catch {
    return { valid: false, error: 'Impossible de décoder l\'image base64' }
  }
}

/**
 * Détecter le type MIME réel d'une image via ses magic bytes
 */
function detectImageMimeType(buffer: Buffer): string | null {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png'
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif'
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
}
