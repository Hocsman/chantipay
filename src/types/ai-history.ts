import { QuoteItemInput } from './quote'
import type { QuoteAgentType } from '@/lib/ai/quoteAgents'

/**
 * Structure d'une entrée dans l'historique des générations IA
 */
export interface AIHistoryEntry {
  id: string
  timestamp: number
  description: string
  trade?: string
  vatRate?: number
  agent?: QuoteAgentType
  items: QuoteItemInput[]
}

/**
 * Configuration de l'historique
 */
export const AI_HISTORY_CONFIG = {
  MAX_ENTRIES: 5,
  STORAGE_KEY: 'chantipay_ai_history',
} as const
