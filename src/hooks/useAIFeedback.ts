'use client'

import { useState, useCallback } from 'react'

export type FeedbackType = 'helpful' | 'not_helpful'
export type FeedbackContext =
  | 'suggestion'       // Suggestions de compléments
  | 'quote_generation' // Génération de devis
  | 'photo_analysis'   // Analyse de photo
  | 'smart_edit'       // Modification intelligente
  | 'price_hint'       // Suggestion de prix
  | 'variants'         // Devis comparatifs

interface FeedbackEntry {
  id: string
  context: FeedbackContext
  itemId?: string
  feedback: FeedbackType
  timestamp: string
  metadata?: Record<string, unknown>
}

interface FeedbackStats {
  helpful: number
  notHelpful: number
  total: number
  helpfulRate: number
}

const STORAGE_KEY = 'chantipay_ai_feedback'
const MAX_ENTRIES = 500

function loadFromStorage(): FeedbackEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveToStorage(entries: FeedbackEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    // Keep only the most recent entries
    const toSave = entries.slice(-MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch (error) {
    console.error('Failed to save AI feedback:', error)
  }
}

export function useAIFeedback() {
  const [feedbackGiven, setFeedbackGiven] = useState<Map<string, FeedbackType>>(new Map())

  // Record feedback for a specific item
  const recordFeedback = useCallback((
    context: FeedbackContext,
    feedback: FeedbackType,
    itemId?: string,
    metadata?: Record<string, unknown>
  ): void => {
    const entries = loadFromStorage()

    const entry: FeedbackEntry = {
      id: `${context}-${itemId || 'general'}-${Date.now()}`,
      context,
      itemId,
      feedback,
      timestamp: new Date().toISOString(),
      metadata,
    }

    entries.push(entry)
    saveToStorage(entries)

    // Track in state for UI updates
    if (itemId) {
      setFeedbackGiven(prev => {
        const next = new Map(prev)
        next.set(itemId, feedback)
        return next
      })
    }
  }, [])

  // Check if feedback was already given for an item
  const hasFeedback = useCallback((itemId: string): boolean => {
    return feedbackGiven.has(itemId)
  }, [feedbackGiven])

  // Get feedback for an item
  const getFeedback = useCallback((itemId: string): FeedbackType | undefined => {
    return feedbackGiven.get(itemId)
  }, [feedbackGiven])

  // Get statistics for a specific context
  const getStats = useCallback((context?: FeedbackContext): FeedbackStats => {
    const entries = loadFromStorage()
    const filtered = context
      ? entries.filter(e => e.context === context)
      : entries

    const helpful = filtered.filter(e => e.feedback === 'helpful').length
    const notHelpful = filtered.filter(e => e.feedback === 'not_helpful').length
    const total = filtered.length

    return {
      helpful,
      notHelpful,
      total,
      helpfulRate: total > 0 ? (helpful / total) * 100 : 0,
    }
  }, [])

  // Get all entries (for debug or export)
  const getAllEntries = useCallback((): FeedbackEntry[] => {
    return loadFromStorage()
  }, [])

  // Clear all feedback
  const clearAll = useCallback((): void => {
    saveToStorage([])
    setFeedbackGiven(new Map())
  }, [])

  return {
    recordFeedback,
    hasFeedback,
    getFeedback,
    getStats,
    getAllEntries,
    clearAll,
  }
}
