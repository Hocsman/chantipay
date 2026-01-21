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
 * MAX_ENTRIES est pour le fallback localStorage (la BDD garde jusqu'à 50)
 */
export const AI_HISTORY_CONFIG = {
  MAX_ENTRIES: 10,
  STORAGE_KEY: 'chantipay_ai_history',
  DB_MAX_ENTRIES: 50,
} as const
