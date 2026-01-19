'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ===========================================
// Types
// ===========================================
interface PriceStatistics {
  avgPrice: number
  minPrice: number
  maxPrice: number
  count: number
  lastUsed: string | null
}

interface UserPreferences {
  pricesByCategory: Record<string, PriceStatistics>
  avgHourlyRate: number | null
  commonFormulations: string[]
  preferredVatRates: { rate: number; count: number }[]
  totalQuotes: number
  totalItems: number
  priceAnomalyThreshold: {
    low: number
    high: number
  } | null
}

interface PriceHint {
  message: string | null
  suggestedPrice: number | null
  confidence: 'high' | 'medium' | 'low'
  basedOn: number
}

interface UseUserPricePreferencesReturn {
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
  // Obtenir une suggestion de prix pour une description
  getPriceHint: (description: string) => Promise<PriceHint | null>
  // Vérifier si un prix est anormal
  isPriceAnomaly: (price: number) => 'low' | 'high' | null
  // Obtenir le taux de TVA préféré
  getPreferredVatRate: () => number
  // Rafraîchir les préférences
  refresh: () => Promise<void>
}

// ===========================================
// Hook
// ===========================================
export function useUserPricePreferences(): UseUserPricePreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cache pour les suggestions de prix
  const hintCache = useRef<Map<string, { hint: PriceHint; timestamp: number }>>(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Charger les préférences
  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/ai/user-preferences')

      if (!response.ok) {
        if (response.status === 401) {
          // Non authentifié - pas une erreur
          setPreferences(null)
          return
        }
        throw new Error('Erreur lors du chargement des préférences')
      }

      const data: UserPreferences = await response.json()
      setPreferences(data)
    } catch (err) {
      console.error('Erreur chargement préférences:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Obtenir une suggestion de prix
  const getPriceHint = useCallback(async (description: string): Promise<PriceHint | null> => {
    if (!description || description.length < 5) {
      return null
    }

    // Vérifier le cache
    const cacheKey = description.toLowerCase().trim()
    const cached = hintCache.current.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.hint
    }

    try {
      const response = await fetch('/api/ai/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemDescription: description }),
      })

      if (!response.ok) {
        return null
      }

      const hint: PriceHint = await response.json()

      // Mettre en cache
      hintCache.current.set(cacheKey, { hint, timestamp: Date.now() })

      return hint
    } catch (err) {
      console.error('Erreur obtention suggestion prix:', err)
      return null
    }
  }, [])

  // Vérifier si un prix est anormal
  const isPriceAnomaly = useCallback((price: number): 'low' | 'high' | null => {
    if (!preferences?.priceAnomalyThreshold) {
      return null
    }

    const { low, high } = preferences.priceAnomalyThreshold

    if (price < low) return 'low'
    if (price > high) return 'high'
    return null
  }, [preferences])

  // Obtenir le taux de TVA préféré
  const getPreferredVatRate = useCallback((): number => {
    if (!preferences?.preferredVatRates || preferences.preferredVatRates.length === 0) {
      return 20 // Défaut
    }
    return preferences.preferredVatRates[0].rate
  }, [preferences])

  // Rafraîchir
  const refresh = useCallback(async () => {
    hintCache.current.clear()
    await loadPreferences()
  }, [loadPreferences])

  return {
    preferences,
    isLoading,
    error,
    getPriceHint,
    isPriceAnomaly,
    getPreferredVatRate,
    refresh,
  }
}
