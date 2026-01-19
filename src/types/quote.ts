/**
 * Shared types for quote items
 * Used by both API routes and frontend components
 */
import type { QuoteAgentType } from '@/lib/ai/quoteAgents'

/**
 * Input type for quote line items
 * Used when generating quotes via AI or manual input
 */
export type QuoteItemInput = {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

/**
 * Request body for AI quote generation
 */
export type GenerateQuoteRequest = {
  description: string    // Required: min 20 chars, max 2000
  trade?: string         // Optional: type of trade
  vat_rate?: number      // Optional: default VAT rate (0-30)
  agent?: QuoteAgentType
}

/**
 * Response from AI quote generation
 */
export type GenerateQuoteResponse = {
  items: QuoteItemInput[]
}
