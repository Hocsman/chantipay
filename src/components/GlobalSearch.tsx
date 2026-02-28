'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Search, Users, FileText, Receipt, Undo2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'client' | 'quote' | 'invoice' | 'credit_note'
  id: string
  title: string
  subtitle: string
  status?: string
  href: string
}

const TYPE_CONFIG = {
  client: { label: 'Client', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
  quote: { label: 'Devis', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
  invoice: { label: 'Facture', icon: Receipt, color: 'text-green-500 bg-green-500/10' },
  credit_note: { label: 'Avoir', icon: Undo2, color: 'text-red-500 bg-red-500/10' },
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  signed: 'Signé',
  refused: 'Refusé',
  deposit_paid: 'Acompte payé',
  completed: 'Terminé',
  canceled: 'Annulé',
  paid: 'Payé',
  partial: 'Partiel',
  overdue: 'En retard',
  finalized: 'Finalisé',
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Raccourci clavier CMD+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Recherche avec debounce
  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results || [])
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Erreur recherche:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  // Navigation clavier dans les résultats
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigateTo(results[selectedIndex])
    }
  }

  const navigateTo = (result: SearchResult) => {
    setOpen(false)
    router.push(result.href)
  }

  // Regrouper par type
  const grouped = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Index global pour la navigation clavier
  let globalIndex = -1

  return (
    <>
      {/* Bouton trigger desktop */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Rechercher...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Bouton trigger mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Dialog de recherche */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="p-0 gap-0 max-w-lg overflow-hidden"
          showCloseButton={false}
        >
          {/* Barre de recherche */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher un client, devis, facture, avoir..."
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Résultats */}
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caractères pour rechercher
              </div>
            ) : !isLoading && results.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aucun résultat pour &laquo; {query} &raquo;
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
                return (
                  <div key={type}>
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {config.label}s
                    </div>
                    {items.map((result) => {
                      globalIndex++
                      const idx = globalIndex
                      const Icon = config.icon
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigateTo(result)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            selectedIndex === idx
                              ? 'bg-primary/10 text-foreground'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <div className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                            config.color
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          {result.status && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {STATUS_LABELS[result.status] || result.status}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border px-1 font-mono text-[10px]">↑</kbd>
                <kbd className="inline-flex h-4 items-center rounded border px-1 font-mono text-[10px]">↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex h-4 items-center rounded border px-1 font-mono text-[10px]">↵</kbd>
                ouvrir
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
