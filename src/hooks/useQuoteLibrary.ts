'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type LibraryItem,
  type QuoteLibrary,
  LIBRARY_CONFIG,
} from '@/types/quote-library'

/**
 * Hook pour gérer la bibliothèque personnelle de lignes de devis
 * Stockage dans localStorage pour une utilisation hors-ligne
 */
export function useQuoteLibrary() {
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger la bibliothèque depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LIBRARY_CONFIG.STORAGE_KEY)
      if (stored) {
        const parsed: QuoteLibrary = JSON.parse(stored)
        setLibrary(parsed.items || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la bibliothèque:', error)
      setLibrary([])
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Sauvegarder dans localStorage
  const saveLibrary = useCallback((items: LibraryItem[]) => {
    try {
      const data: QuoteLibrary = {
        version: LIBRARY_CONFIG.VERSION,
        items,
      }
      localStorage.setItem(LIBRARY_CONFIG.STORAGE_KEY, JSON.stringify(data))
      setLibrary(items)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la bibliothèque:', error)
    }
  }, [])

  // Ajouter un item à la bibliothèque
  const addItem = useCallback(
    (item: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (library.length >= LIBRARY_CONFIG.MAX_ITEMS) {
        return { success: false, error: 'Limite de 100 items atteinte' }
      }

      const newItem: LibraryItem = {
        ...item,
        id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const newLibrary = [...library, newItem]
      saveLibrary(newLibrary)
      return { success: true, item: newItem }
    },
    [library, saveLibrary]
  )

  // Mettre à jour un item
  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<LibraryItem, 'id' | 'createdAt'>>) => {
      const newLibrary = library.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: Date.now() }
          : item
      )
      saveLibrary(newLibrary)
    },
    [library, saveLibrary]
  )

  // Supprimer un item
  const removeItem = useCallback(
    (id: string) => {
      const newLibrary = library.filter((item) => item.id !== id)
      saveLibrary(newLibrary)
    },
    [library, saveLibrary]
  )

  // Vider la bibliothèque
  const clearLibrary = useCallback(() => {
    saveLibrary([])
  }, [saveLibrary])

  // Obtenir les items par métier
  const getItemsByTrade = useCallback(
    (trade: string) => {
      return library.filter((item) => item.trade === trade)
    },
    [library]
  )

  // Obtenir les métiers uniques
  const getTrades = useCallback(() => {
    const trades = library.map((item) => item.trade)
    return Array.from(new Set(trades))
  }, [library])

  // Exporter la bibliothèque en JSON
  const exportToJSON = useCallback(() => {
    const data: QuoteLibrary = {
      version: LIBRARY_CONFIG.VERSION,
      items: library,
      exportedAt: Date.now(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chantipay-bibliotheque-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [library])

  // Importer depuis un fichier JSON
  const importFromJSON = useCallback(
    (file: File): Promise<{ success: boolean; count: number; error?: string }> => {
      return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const data: QuoteLibrary = JSON.parse(content)

            // Validation basique
            if (!data.items || !Array.isArray(data.items)) {
              resolve({ success: false, count: 0, error: 'Format de fichier invalide' })
              return
            }

            // Valider et nettoyer les items
            const validItems: LibraryItem[] = data.items
              .filter(
                (item) =>
                  item.description &&
                  typeof item.unit_price_ht === 'number' &&
                  item.trade
              )
              .map((item) => ({
                id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                description: item.description,
                unit_price_ht: item.unit_price_ht,
                vat_rate: item.vat_rate || 20,
                trade: item.trade,
                category: item.category,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }))

            // Fusionner avec la bibliothèque existante (éviter les doublons par description)
            const existingDescriptions = new Set(library.map((i) => i.description.toLowerCase()))
            const newItems = validItems.filter(
              (item) => !existingDescriptions.has(item.description.toLowerCase())
            )

            const mergedLibrary = [...library, ...newItems].slice(0, LIBRARY_CONFIG.MAX_ITEMS)
            saveLibrary(mergedLibrary)

            resolve({ success: true, count: newItems.length })
          } catch (error) {
            console.error('Erreur import JSON:', error)
            resolve({ success: false, count: 0, error: 'Erreur lors de la lecture du fichier' })
          }
        }

        reader.onerror = () => {
          resolve({ success: false, count: 0, error: 'Erreur lors de la lecture du fichier' })
        }

        reader.readAsText(file)
      })
    },
    [library, saveLibrary]
  )

  // Ajouter une ligne de devis à la bibliothèque (depuis la création de devis)
  const addFromQuoteLine = useCallback(
    (description: string, unitPriceHt: number, vatRate: number, trade: string) => {
      return addItem({
        description,
        unit_price_ht: unitPriceHt,
        vat_rate: vatRate,
        trade,
      })
    },
    [addItem]
  )

  return {
    library,
    isLoaded,
    addItem,
    updateItem,
    removeItem,
    clearLibrary,
    getItemsByTrade,
    getTrades,
    exportToJSON,
    importFromJSON,
    addFromQuoteLine,
    itemCount: library.length,
    maxItems: LIBRARY_CONFIG.MAX_ITEMS,
  }
}
