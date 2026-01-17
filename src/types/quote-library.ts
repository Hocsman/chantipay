/**
 * Types pour la bibliothèque personnelle de lignes de devis
 */

export interface LibraryItem {
  id: string
  description: string
  unit_price_ht: number
  vat_rate: number
  trade: string
  category?: string
  createdAt: number
  updatedAt: number
}

export interface QuoteLibrary {
  version: number
  items: LibraryItem[]
  exportedAt?: number
}

export const LIBRARY_CONFIG = {
  STORAGE_KEY: 'chantipay_quote_library',
  VERSION: 1,
  MAX_ITEMS: 100,
} as const

export const TRADE_OPTIONS = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'maconnerie', label: 'Maçonnerie' },
  { value: 'carrelage', label: 'Carrelage' },
  { value: 'chauffage', label: 'Chauffage' },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'toiture', label: 'Toiture' },
  { value: 'autre', label: 'Autre' },
] as const

export type TradeName = typeof TRADE_OPTIONS[number]['value']
