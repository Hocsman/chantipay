'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UserTemplate {
  id: string
  title: string
  description: string
  trade: string
  category: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'chantipay_user_templates'
const MAX_TEMPLATES = 50

function loadFromStorage(): UserTemplate[] {
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

function saveToStorage(templates: UserTemplate[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('Failed to save user templates:', error)
  }
}

export function useUserTemplates() {
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load templates on mount
  useEffect(() => {
    const loaded = loadFromStorage()
    setTemplates(loaded)
    setIsLoading(false)
  }, [])

  // Add a new template
  const addTemplate = useCallback((
    title: string,
    description: string,
    trade: string,
    category: string = 'Personnalisé'
  ): UserTemplate | null => {
    if (!title.trim() || !description.trim()) return null
    if (templates.length >= MAX_TEMPLATES) {
      console.warn('Maximum templates limit reached')
      return null
    }

    const now = new Date().toISOString()
    const newTemplate: UserTemplate = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      description: description.trim(),
      trade: trade || 'autre',
      category: category.trim() || 'Personnalisé',
      createdAt: now,
      updatedAt: now,
    }

    const updated = [newTemplate, ...templates]
    setTemplates(updated)
    saveToStorage(updated)
    return newTemplate
  }, [templates])

  // Update an existing template
  const updateTemplate = useCallback((
    id: string,
    updates: Partial<Pick<UserTemplate, 'title' | 'description' | 'trade' | 'category'>>
  ): boolean => {
    const index = templates.findIndex(t => t.id === id)
    if (index === -1) return false

    const updated = [...templates]
    updated[index] = {
      ...updated[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    setTemplates(updated)
    saveToStorage(updated)
    return true
  }, [templates])

  // Remove a template
  const removeTemplate = useCallback((id: string): boolean => {
    const index = templates.findIndex(t => t.id === id)
    if (index === -1) return false

    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    saveToStorage(updated)
    return true
  }, [templates])

  // Get templates by trade
  const getByTrade = useCallback((trade: string): UserTemplate[] => {
    if (!trade) return templates
    return templates.filter(t => t.trade === trade)
  }, [templates])

  // Get categories for a trade
  const getCategoriesForTrade = useCallback((trade: string): string[] => {
    const tradeTemplates = getByTrade(trade)
    const categories = tradeTemplates.map(t => t.category)
    return Array.from(new Set(categories))
  }, [getByTrade])

  // Clear all templates
  const clearAll = useCallback((): void => {
    setTemplates([])
    saveToStorage([])
  }, [])

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    removeTemplate,
    getByTrade,
    getCategoriesForTrade,
    clearAll,
    count: templates.length,
    maxTemplates: MAX_TEMPLATES,
  }
}
