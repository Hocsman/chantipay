'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles } from 'lucide-react'
import { QUOTE_TEMPLATES, getTemplatesByTrade, getCategoriesByTrade, type QuoteTemplate } from '@/lib/templates/quoteTemplates'

interface TemplateSelectorProps {
  selectedTrade?: string
  onSelectTemplate: (template: QuoteTemplate) => void
}

/**
 * Composant Desktop : Dialog avec sélection de templates
 */
export function TemplateSelector({ selectedTrade, onSelectTemplate }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Templates filtrés par métier
  const templates = useMemo(() => {
    if (!selectedTrade) return QUOTE_TEMPLATES
    return getTemplatesByTrade(selectedTrade)
  }, [selectedTrade])

  // Catégories disponibles
  const categories = useMemo(() => {
    if (!selectedTrade) return []
    return getCategoriesByTrade(selectedTrade)
  }, [selectedTrade])

  // Templates filtrés par catégorie
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return templates
    return templates.filter(t => t.category === selectedCategory)
  }, [templates, selectedCategory])

  const handleSelectTemplate = (template: QuoteTemplate) => {
    onSelectTemplate(template)
    setOpen(false)
    setSelectedCategory(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bibliothèque de templates
          </DialogTitle>
          <DialogDescription>
            {selectedTrade
              ? `Sélectionnez un template pour ${selectedTrade}`
              : 'Choisissez un métier pour voir les templates disponibles'
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedTrade ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Veuillez d&apos;abord sélectionner un métier</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filtres par catégorie */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Tous ({templates.length})
                </Button>
                {categories.map(category => {
                  const count = templates.filter(t => t.category === category).length
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category} ({count})
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Liste des templates */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun template disponible pour ce métier</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-sm">{template.title}</h4>
                        <Badge variant="secondary" className="shrink-0">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {template.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {filteredTemplates.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                💡 Cliquez sur un template pour l&apos;utiliser
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
