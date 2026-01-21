import { useState, useEffect, useCallback, useRef } from 'react'
import { AIHistoryEntry, AI_HISTORY_CONFIG } from '@/types/ai-history'
import { QuoteItemInput } from '@/types/quote'

/**
 * Hook personnalisé pour gérer l'historique des générations IA
 * Stocke l'historique en base de données Supabase avec fallback localStorage
 */
export function useAIHistory() {
  const [history, setHistory] = useState<AIHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  // Charger l'historique depuis l'API au montage
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    const fetchHistory = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/ai/history?limit=10')
        
        if (response.ok) {
          const data = await response.json()
          setHistory(data.history || [])
        } else if (response.status === 401) {
          // Non authentifié - utiliser localStorage comme fallback
          loadFromLocalStorage()
        } else {
          throw new Error('Erreur serveur')
        }
      } catch (err) {
        console.error('Erreur chargement historique IA:', err)
        // Fallback vers localStorage
        loadFromLocalStorage()
        setError('Impossible de charger depuis le serveur, utilisation du cache local')
      } finally {
        setIsLoading(false)
      }
    }

    const loadFromLocalStorage = () => {
      try {
        const stored = localStorage.getItem(AI_HISTORY_CONFIG.STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AIHistoryEntry[]
          setHistory(parsed)
        }
      } catch (e) {
        console.error('Erreur chargement localStorage:', e)
        setHistory([])
      }
    }

    fetchHistory()
  }, [])

  // Sauvegarder aussi en localStorage pour le fallback
  const saveToLocalStorage = useCallback((entries: AIHistoryEntry[]) => {
    try {
      const toSave = entries.slice(0, AI_HISTORY_CONFIG.MAX_ENTRIES)
      localStorage.setItem(AI_HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e)
    }
  }, [])

  /**
   * Ajouter une nouvelle génération à l'historique
   * Sauvegarde en BDD et localStorage
   */
  const addToHistory = useCallback(
    async (
      description: string,
      items: QuoteItemInput[],
      trade?: string,
      vatRate?: number,
      agent?: AIHistoryEntry['agent']
    ) => {
      // Créer l'entrée localement d'abord pour une UI réactive
      const tempEntry: AIHistoryEntry = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        description,
        trade,
        vatRate,
        agent,
        items,
      }

      // Mise à jour optimiste
      const newHistory = [tempEntry, ...history].slice(0, AI_HISTORY_CONFIG.MAX_ENTRIES)
      setHistory(newHistory)
      saveToLocalStorage(newHistory)

      // Sauvegarder en BDD
      try {
        const response = await fetch('/api/ai/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            items,
            trade,
            vatRate,
            agent,
          }),
        })

        if (response.ok) {
          const savedEntry = await response.json()
          // Remplacer l'entrée temporaire par celle de la BDD
          setHistory(prev => {
            const updated = prev.map(e => 
              e.id === tempEntry.id ? savedEntry : e
            )
            saveToLocalStorage(updated)
            return updated
          })
        }
      } catch (err) {
        console.error('Erreur sauvegarde historique IA en BDD:', err)
        // L'entrée reste en localStorage
      }
    },
    [history, saveToLocalStorage]
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
    async (entryId: string) => {
      // Mise à jour optimiste
      const newHistory = history.filter((e) => e.id !== entryId)
      setHistory(newHistory)
      saveToLocalStorage(newHistory)

      // Supprimer en BDD si ce n'est pas une entrée temporaire
      if (!entryId.startsWith('temp-')) {
        try {
          await fetch(`/api/ai/history/${entryId}`, {
            method: 'DELETE',
          })
        } catch (err) {
          console.error('Erreur suppression historique IA en BDD:', err)
        }
      }
    },
    [history, saveToLocalStorage]
  )

  /**
   * Vider tout l'historique
   */
  const clearHistory = useCallback(async () => {
    setHistory([])
    saveToLocalStorage([])

    try {
      await fetch('/api/ai/history', {
        method: 'DELETE',
      })
    } catch (err) {
      console.error('Erreur suppression totale historique IA:', err)
    }
  }, [saveToLocalStorage])

  /**
   * Recharger l'historique depuis le serveur
   */
  const refreshHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        saveToLocalStorage(data.history || [])
      }
    } catch (err) {
      console.error('Erreur rafraîchissement historique:', err)
    } finally {
      setIsLoading(false)
    }
  }, [saveToLocalStorage])

  return {
    history,
    isLoading,
    error,
    addToHistory,
    restoreFromHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
  }
}
