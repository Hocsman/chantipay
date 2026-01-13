/**
 * ===========================================
 * Quote Auto-Save Hook
 * ===========================================
 * Automatically saves quote drafts to local storage
 */

import { useEffect, useRef, useCallback } from 'react'

export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

export interface QuoteDraft {
  clientId: string | null
  vatRate: string
  depositPercent: string
  items: QuoteItem[]
  aiDescription: string
  selectedTrade: string
  savedAt: number
}

const STORAGE_KEY = 'chantipay_quote_draft'
const AUTO_SAVE_DELAY = 2000 // 2 seconds

/**
 * Hook pour sauvegarder automatiquement un brouillon de devis
 */
export function useQuoteAutoSave(
  clientId: string | null,
  vatRate: string,
  depositPercent: string,
  items: QuoteItem[],
  aiDescription: string,
  selectedTrade: string,
  enabled = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastSavedRef = useRef<string>('')

  /**
   * Sauvegarde le brouillon dans le local storage
   */
  const saveDraft = useCallback(() => {
    if (!enabled) return

    const draft: QuoteDraft = {
      clientId,
      vatRate,
      depositPercent,
      items,
      aiDescription,
      selectedTrade,
      savedAt: Date.now(),
    }

    const draftString = JSON.stringify(draft)

    // Éviter de sauvegarder si rien n'a changé
    if (draftString === lastSavedRef.current) {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, draftString)
      lastSavedRef.current = draftString
      console.log('✅ Draft saved')
    } catch (error) {
      console.error('❌ Error saving draft:', error)
    }
  }, [enabled, clientId, vatRate, depositPercent, items, aiDescription, selectedTrade])

  /**
   * Auto-save avec debounce
   */
  useEffect(() => {
    if (!enabled) return

    // Ignorer si le brouillon est vide
    const isEmpty =
      !clientId &&
      items.length === 0 &&
      !aiDescription.trim() &&
      !selectedTrade

    if (isEmpty) {
      return
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(saveDraft, AUTO_SAVE_DELAY)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, clientId, vatRate, depositPercent, items, aiDescription, selectedTrade, saveDraft])

  /**
   * Charge le brouillon depuis le local storage
   */
  const loadDraft = useCallback((): QuoteDraft | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const draft = JSON.parse(saved) as QuoteDraft

      // Vérifier que le brouillon n'est pas trop ancien (plus de 7 jours)
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days
      if (Date.now() - draft.savedAt > MAX_AGE) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return draft
    } catch (error) {
      console.error('❌ Error loading draft:', error)
      return null
    }
  }, [])

  /**
   * Supprime le brouillon
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      lastSavedRef.current = ''
      console.log('✅ Draft cleared')
    } catch (error) {
      console.error('❌ Error clearing draft:', error)
    }
  }, [])

  /**
   * Vérifie si un brouillon existe
   */
  const hasDraft = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return !!saved
    } catch {
      return false
    }
  }, [])

  return {
    loadDraft,
    clearDraft,
    hasDraft,
    saveDraft, // Pour sauvegarder manuellement si besoin
  }
}

/**
 * Formate la date de sauvegarde
 */
export function formatSavedAt(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'à l\'instant'
  if (minutes === 1) return 'il y a 1 minute'
  if (minutes < 60) return `il y a ${minutes} minutes`
  if (hours === 1) return 'il y a 1 heure'
  if (hours < 24) return `il y a ${hours} heures`
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}
