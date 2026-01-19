import { useState, useEffect, useCallback } from 'react'
import { AIHistoryEntry, AI_HISTORY_CONFIG } from '@/types/ai-history'
import { QuoteItemInput } from '@/types/quote'

/**
 * Hook personnalisé pour gérer l'historique des générations IA
 * Stocke les 5 dernières générations dans localStorage
 */
export function useAIHistory() {
  const [history, setHistory] = useState<AIHistoryEntry[]>([])

  // Charger l'historique depuis localStorage au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AI_HISTORY_CONFIG.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AIHistoryEntry[]
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique IA:', error)
      setHistory([])
    }
  }, [])

  // Sauvegarder l'historique dans localStorage
  const saveHistory = useCallback((newHistory: AIHistoryEntry[]) => {
    try {
      localStorage.setItem(AI_HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique IA:', error)
    }
  }, [])

  /**
   * Ajouter une nouvelle génération à l'historique
   * Garde seulement les 5 dernières entrées
   */
  const addToHistory = useCallback(
    (
      description: string,
      items: QuoteItemInput[],
      trade?: string,
      vatRate?: number,
      agent?: AIHistoryEntry['agent']
    ) => {
      const newEntry: AIHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        description,
        trade,
        vatRate,
        agent,
        items,
      }

      // Ajouter en début de liste et limiter à MAX_ENTRIES
      const newHistory = [newEntry, ...history].slice(0, AI_HISTORY_CONFIG.MAX_ENTRIES)
      saveHistory(newHistory)
    },
    [history, saveHistory]
  )

  /**
   * Restaurer une génération depuis l'historique
   */
  const restoreFromHistory = useCallback((entryId: string): AIHistoryEntry | null => {
    const entry = history.find((e) => e.id === entryId)
    return entry || null
  }, [history])

  /**
   * Supprimer une entrée de l'historique
   */
  const removeFromHistory = useCallback(
    (entryId: string) => {
      const newHistory = history.filter((e) => e.id !== entryId)
      saveHistory(newHistory)
    },
    [history, saveHistory]
  )

  /**
   * Vider tout l'historique
   */
  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  return {
    history,
    addToHistory,
    restoreFromHistory,
    removeFromHistory,
    clearHistory,
  }
}
