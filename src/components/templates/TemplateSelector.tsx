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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Sparkles, User, Trash2 } from 'lucide-react'
import { QUOTE_TEMPLATES, getTemplatesByTrade, getCategoriesByTrade, type QuoteTemplate } from '@/lib/templates/quoteTemplates'
import { useUserTemplates, type UserTemplate } from '@/hooks/useUserTemplates'
import { toast } from 'sonner'

interface TemplateSelectorProps {
  selectedTrade?: string
  onSelectTemplate: (template: QuoteTemplate) => void
}

/**
 * Composant Desktop : Dialog avec sélection de templates (système + personnalisés)
 */
export function TemplateSelector({ selectedTrade, onSelectTemplate }: TemplateSelectorProps) {
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
    // Convert UserTemplate to QuoteTemplate format if needed
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

  const currentTemplates = activeTab === 'system' ? filteredSystemTemplates : filteredUserTemplatesByCategory

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Templates
          {filteredUserTemplates.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {filteredUserTemplates.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Système ({systemTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mes templates ({filteredUserTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Filtres par catégorie */}
              {systemCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
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
                      >
                        {category} ({count})
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Liste des templates système */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {filteredSystemTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Aucun template disponible pour ce métier</p>
                    </div>
                  ) : (
                    filteredSystemTemplates.map(template => (
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
            </TabsContent>

            <TabsContent value="user" className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Filtres par catégorie utilisateur */}
              {userCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
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
                      >
                        {category} ({count})
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Liste des templates utilisateur */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3">
                  {filteredUserTemplatesByCategory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun template personnalisé</p>
                      <p className="text-xs mt-2">
                        Créez vos propres templates en cliquant sur &quot;Sauvegarder&quot;
                        après avoir rédigé une description
                      </p>
                    </div>
                  ) : (
                    filteredUserTemplatesByCategory.map(template => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer group"
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
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {currentTemplates.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Cliquez sur un template pour l&apos;utiliser
              </p>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
