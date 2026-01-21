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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Sparkles, User, Trash2 } from 'lucide-react'
import { QUOTE_TEMPLATES, getTemplatesByTrade, getCategoriesByTrade, type QuoteTemplate } from '@/lib/templates/quoteTemplates'
import { useUserTemplates, type UserTemplate } from '@/hooks/useUserTemplates'
import { toast } from 'sonner'

interface TemplateSelectorSheetProps {
  selectedTrade?: string
  onSelectTemplate: (template: QuoteTemplate) => void
}

/**
 * Composant Mobile : Sheet (bottom drawer) avec sélection de templates (système + personnalisés)
 */
export function TemplateSelectorSheet({ selectedTrade, onSelectTemplate }: TemplateSelectorSheetProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'system' | 'user'>('system')

  const { templates: userTemplates, getByTrade, getCategoriesForTrade, removeTemplate } = useUserTemplates()

  // Templates système filtrés par métier
  const systemTemplates = useMemo(() => {
    if (!selectedTrade) return QUOTE_TEMPLATES
    return getTemplatesByTrade(selectedTrade)
  }, [selectedTrade])

  // Templates utilisateur filtrés par métier
  const filteredUserTemplates = useMemo(() => {
    if (!selectedTrade) return userTemplates
    return getByTrade(selectedTrade)
  }, [selectedTrade, userTemplates, getByTrade])

  // Catégories système
  const systemCategories = useMemo(() => {
    if (!selectedTrade) return []
    return getCategoriesByTrade(selectedTrade)
  }, [selectedTrade])

  // Catégories utilisateur
  const userCategories = useMemo(() => {
    if (!selectedTrade) return []
    return getCategoriesForTrade(selectedTrade)
  }, [selectedTrade, getCategoriesForTrade])

  // Templates système filtrés par catégorie
  const filteredSystemTemplates = useMemo(() => {
    if (!selectedCategory) return systemTemplates
    return systemTemplates.filter(t => t.category === selectedCategory)
  }, [systemTemplates, selectedCategory])

  // Templates utilisateur filtrés par catégorie
  const filteredUserTemplatesByCategory = useMemo(() => {
    if (!selectedCategory) return filteredUserTemplates
    return filteredUserTemplates.filter(t => t.category === selectedCategory)
  }, [filteredUserTemplates, selectedCategory])

  const handleSelectTemplate = (template: QuoteTemplate | UserTemplate) => {
    const quoteTemplate: QuoteTemplate = {
      id: template.id,
      title: template.title,
      description: template.description,
      trade: template.trade as QuoteTemplate['trade'],
      category: template.category,
    }
    onSelectTemplate(quoteTemplate)
    setOpen(false)
    setSelectedCategory(null)
  }

  const handleDeleteUserTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeTemplate(id)
    toast.success('Template supprimé')
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'system' | 'user')
    setSelectedCategory(null)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Templates
          {filteredUserTemplates.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {filteredUserTemplates.length}
            </Badge>
          )}
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="system" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Système ({systemTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="user" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                Mes templates ({filteredUserTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-4">
              {/* Filtres par catégorie système */}
              {systemCategories.length > 0 && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    <Button
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className="shrink-0"
                    >
                      Tous ({systemTemplates.length})
                    </Button>
                    {systemCategories.map(category => {
                      const count = systemTemplates.filter(t => t.category === category).length
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

              {/* Liste des templates système */}
              <ScrollArea className="h-[calc(85vh-280px)]">
                <div className="space-y-3 pr-4">
                  {filteredSystemTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>Aucun template disponible pour ce métier</p>
                    </div>
                  ) : (
                    filteredSystemTemplates.map(template => (
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
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              {/* Filtres par catégorie utilisateur */}
              {userCategories.length > 0 && (
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    <Button
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className="shrink-0"
                    >
                      Tous ({filteredUserTemplates.length})
                    </Button>
                    {userCategories.map(category => {
                      const count = filteredUserTemplates.filter(t => t.category === category).length
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

              {/* Liste des templates utilisateur */}
              <ScrollArea className="h-[calc(85vh-280px)]">
                <div className="space-y-3 pr-4">
                  {filteredUserTemplatesByCategory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun template personnalisé</p>
                      <p className="text-xs mt-2">
                        Créez vos propres templates en cliquant sur &quot;Sauvegarder&quot;
                      </p>
                    </div>
                  ) : (
                    filteredUserTemplatesByCategory.map(template => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary hover:bg-accent/50"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-sm">{template.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="shrink-0">
                              {template.category}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleDeleteUserTemplate(e, template.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Appuyez sur un template pour l&apos;utiliser
            </p>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}
