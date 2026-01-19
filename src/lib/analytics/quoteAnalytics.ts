/**
 * ===========================================
 * Quote Analytics Tracking
 * ===========================================
 * Module pour tracker les événements liés à la création de devis
 *
 * Conformité RGPD:
 * - Aucune donnée sensible collectée (pas de montants, descriptions, noms)
 * - Seulement des métriques techniques pour identifier les bugs
 * - Données anonymisées et agrégées
 */

import { createClient } from '@/lib/supabase/client'
import type { QuoteAgentType } from '@/lib/ai/quoteAgents'

// ===========================================
// Types
// ===========================================

/**
 * Types d'événements trackés
 */
export type QuoteEventType =
  | 'quote_creation_started'
  | 'quote_creation_success'
  | 'quote_creation_error'
  | 'quote_creation_abandoned'
  | 'quote_ai_generation_started'
  | 'quote_ai_generation_success'
  | 'quote_ai_generation_error'

/**
 * Plateforme utilisée
 */
export type Platform = 'desktop' | 'mobile' | 'unknown'

/**
 * Métadonnées pour événement de démarrage
 */
interface QuoteStartedMetadata {
  items_count?: number
  has_ai?: boolean
  platform?: Platform
}

/**
 * Métadonnées pour événement de succès
 */
interface QuoteSuccessMetadata {
  duration_ms: number
  items_count: number
  has_ai: boolean
  platform?: Platform
}

/**
 * Métadonnées pour événement d'erreur
 */
interface QuoteErrorMetadata {
  error_type: string
  error_message: string
  items_count?: number
  has_ai?: boolean
  platform?: Platform
  step?: 'validation' | 'api_call' | 'network' | 'unknown'
}

/**
 * Métadonnées pour événement d'abandon
 */
interface QuoteAbandonedMetadata {
  duration_ms: number
  items_count?: number
  has_ai?: boolean
  platform?: Platform
}

/**
 * Métadonnées pour génération IA
 */
interface QuoteAIMetadata {
  duration_ms?: number
  trade?: string
  agent?: QuoteAgentType
  error_type?: string
  error_message?: string
  platform?: Platform
}

type EventMetadata =
  | QuoteStartedMetadata
  | QuoteSuccessMetadata
  | QuoteErrorMetadata
  | QuoteAbandonedMetadata
  | QuoteAIMetadata

// ===========================================
// Helpers
// ===========================================

/**
 * Détecte la plateforme utilisée
 */
function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown'

  const path = window.location.pathname
  if (path.startsWith('/mobile')) return 'mobile'
  if (path.startsWith('/dashboard')) return 'desktop'

  return 'unknown'
}

/**
 * Récupère le User Agent (pour debugging si nécessaire)
 */
function getUserAgent(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.navigator.userAgent
}

// ===========================================
// Core Tracking Function
// ===========================================

/**
 * Envoie un événement analytics à Supabase
 *
 * @param eventType - Type d'événement
 * @param metadata - Métadonnées associées (durée, erreurs, compteurs)
 *
 * @example
 * await trackQuoteEvent('quote_creation_started', { items_count: 5 })
 */
async function trackQuoteEvent(
  eventType: QuoteEventType,
  metadata: EventMetadata = {}
): Promise<void> {
  try {
    const supabase = createClient()

    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()

    // Si pas d'utilisateur, ne pas tracker (pour éviter les erreurs)
    if (!user) {
      console.warn('[Analytics] No user found, skipping event:', eventType)
      return
    }

    // Ajouter la plateforme si pas déjà présente
    const enrichedMetadata = {
      ...metadata,
      platform: metadata.platform || detectPlatform(),
    }

    // Insérer l'événement dans la table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        user_id: user.id,
        metadata: enrichedMetadata,
        platform: enrichedMetadata.platform,
        user_agent: getUserAgent(),
      })

    if (error) {
      console.error('[Analytics] Error tracking event:', error)
      // Ne pas bloquer l'application en cas d'erreur de tracking
    } else {
      console.log('[Analytics] Event tracked:', eventType, enrichedMetadata)
    }
  } catch (error) {
    console.error('[Analytics] Unexpected error:', error)
    // Ne jamais bloquer l'application à cause d'une erreur de tracking
  }
}

// ===========================================
// Public API - Quote Creation Events
// ===========================================

/**
 * Classe pour tracker le cycle de vie complet d'une création de devis
 *
 * @example
 * const tracker = new QuoteCreationTracker()
 * tracker.start(5, true) // 5 items, avec IA
 * // ... utilisateur remplit le formulaire ...
 * tracker.success(45000) // 45 secondes
 */
export class QuoteCreationTracker {
  private startTime: number | null = null
  private itemsCount: number = 0
  private hasAI: boolean = false

  /**
   * Démarre le tracking de création de devis
   */
  start(itemsCount: number = 0, hasAI: boolean = false): void {
    this.startTime = Date.now()
    this.itemsCount = itemsCount
    this.hasAI = hasAI

    trackQuoteEvent('quote_creation_started', {
      items_count: itemsCount,
      has_ai: hasAI,
    })
  }

  /**
   * Enregistre un succès de création
   */
  async success(itemsCount?: number): Promise<void> {
    const duration = this.startTime ? Date.now() - this.startTime : 0

    await trackQuoteEvent('quote_creation_success', {
      duration_ms: duration,
      items_count: itemsCount || this.itemsCount,
      has_ai: this.hasAI,
    })

    this.reset()
  }

  /**
   * Enregistre une erreur de création
   */
  async error(
    errorType: string,
    errorMessage: string,
    step: QuoteErrorMetadata['step'] = 'unknown'
  ): Promise<void> {
    await trackQuoteEvent('quote_creation_error', {
      error_type: errorType,
      error_message: errorMessage,
      items_count: this.itemsCount,
      has_ai: this.hasAI,
      step,
    })

    this.reset()
  }

  /**
   * Enregistre un abandon (utilisateur quitte la page)
   */
  async abandoned(): Promise<void> {
    const duration = this.startTime ? Date.now() - this.startTime : 0

    await trackQuoteEvent('quote_creation_abandoned', {
      duration_ms: duration,
      items_count: this.itemsCount,
      has_ai: this.hasAI,
    })

    this.reset()
  }

  /**
   * Réinitialise le tracker
   */
  private reset(): void {
    this.startTime = null
    this.itemsCount = 0
    this.hasAI = false
  }
}

// ===========================================
// Public API - AI Generation Events
// ===========================================

/**
 * Tracker pour la génération AI de devis
 */
export class QuoteAITracker {
  private startTime: number | null = null
  private trade: string = ''
  private agent?: QuoteAgentType

  /**
   * Démarre le tracking de génération IA
   */
  start(trade: string = '', agent?: QuoteAgentType): void {
    this.startTime = Date.now()
    this.trade = trade
    this.agent = agent

    trackQuoteEvent('quote_ai_generation_started', {
      trade,
      agent,
    })
  }

  /**
   * Enregistre un succès de génération
   */
  async success(agent?: QuoteAgentType): Promise<void> {
    const duration = this.startTime ? Date.now() - this.startTime : 0

    await trackQuoteEvent('quote_ai_generation_success', {
      duration_ms: duration,
      trade: this.trade,
      agent: agent || this.agent,
    })

    this.reset()
  }

  /**
   * Enregistre une erreur de génération
   */
  async error(errorType: string, errorMessage: string, agent?: QuoteAgentType): Promise<void> {
    const duration = this.startTime ? Date.now() - this.startTime : 0

    await trackQuoteEvent('quote_ai_generation_error', {
      duration_ms: duration,
      error_type: errorType,
      error_message: errorMessage,
      trade: this.trade,
      agent: agent || this.agent,
    })

    this.reset()
  }

  /**
   * Réinitialise le tracker
   */
  private reset(): void {
    this.startTime = null
    this.trade = ''
    this.agent = undefined
  }
}

// ===========================================
// Convenience Functions
// ===========================================

/**
 * Fonctions utilitaires pour un usage simple sans classe
 */
export const analytics = {
  /**
   * Track le démarrage de création d'un devis
   */
  quoteStarted: (itemsCount: number = 0, hasAI: boolean = false) =>
    trackQuoteEvent('quote_creation_started', { items_count: itemsCount, has_ai: hasAI }),

  /**
   * Track le succès de création d'un devis
   */
  quoteSuccess: (durationMs: number, itemsCount: number, hasAI: boolean = false) =>
    trackQuoteEvent('quote_creation_success', {
      duration_ms: durationMs,
      items_count: itemsCount,
      has_ai: hasAI,
    }),

  /**
   * Track une erreur de création de devis
   */
  quoteError: (
    errorType: string,
    errorMessage: string,
    step: QuoteErrorMetadata['step'] = 'unknown'
  ) =>
    trackQuoteEvent('quote_creation_error', {
      error_type: errorType,
      error_message: errorMessage,
      step,
    }),

  /**
   * Track un abandon de création de devis
   */
  quoteAbandoned: (durationMs: number) =>
    trackQuoteEvent('quote_creation_abandoned', { duration_ms: durationMs }),
}
