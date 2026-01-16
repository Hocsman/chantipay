'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles } from 'lucide-react'
import { QUOTE_TEMPLATES, getTemplatesByTrade, getCategoriesByTrade, type QuoteTemplate } from '@/lib/templates/quoteTemplates'

interface TemplateSelectorSheetProps {
  selectedTrade?: string
  onSelectTemplate: (template: QuoteTemplate) => void
}

/**
 * Composant Mobile : Sheet (bottom drawer) avec sélection de templates
 */
export function TemplateSelectorSheet({ selectedTrade, onSelectTemplate }: TemplateSelectorSheetProps) {
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bibliothèque de templates
          </SheetTitle>
          <SheetDescription>
            {selectedTrade
              ? `Sélectionnez un template pour ${selectedTrade}`
              : 'Choisissez un métier pour voir les templates disponibles'
            }
          </SheetDescription>
        </SheetHeader>

        {!selectedTrade ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Veuillez d&apos;abord sélectionner un métier</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {/* Filtres par catégorie */}
            {categories.length > 0 && (
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="shrink-0"
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
                        className="shrink-0"
                      >
                        {category} ({count})
                      </Button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Liste des templates */}
            <ScrollArea className="h-[calc(85vh-200px)]">
              <div className="space-y-3 pr-4">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun template disponible pour ce métier</p>
                  </div>
                ) : (
                  filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary hover:bg-accent/50"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-sm">{template.title}</h4>
                        <Badge variant="secondary" className="shrink-0">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {filteredTemplates.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                💡 Appuyez sur un template pour l&apos;utiliser
              </p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
