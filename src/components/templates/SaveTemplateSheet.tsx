'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUserTemplates } from '@/hooks/useUserTemplates'

interface SaveTemplateSheetProps {
  description: string
  trade: string
  disabled?: boolean
}

export function SaveTemplateSheet({
  description,
  trade,
  disabled,
}: SaveTemplateSheetProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Personnalisé')
  const [editedDescription, setEditedDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { addTemplate, count, maxTemplates } = useUserTemplates()

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setEditedDescription(description)
      setTitle('')
      setCategory('Personnalisé')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Veuillez donner un titre au template')
      return
    }

    if (!editedDescription.trim()) {
      toast.error('La description ne peut pas être vide')
      return
    }

    if (count >= maxTemplates) {
      toast.error(`Limite atteinte : ${maxTemplates} templates maximum`)
      return
    }

    setIsSaving(true)

    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    const result = addTemplate(title, editedDescription, trade, category)

    if (result) {
      toast.success('Template sauvegardé', {
        description: `"${title}" a été ajouté à vos templates`,
      })
      setOpen(false)
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }

    setIsSaving(false)
  }

  const isDisabled = disabled || !description.trim() || description.trim().length < 20

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          className="h-8"
        >
          <Save className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Sauvegarder comme template</SheetTitle>
          <SheetDescription>
            Créez un template réutilisable
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="template-title-mobile">Titre du template *</Label>
            <Input
              id="template-title-mobile"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Installation chauffe-eau 200L"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category-mobile">Catégorie</Label>
            <Input
              id="template-category-mobile"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Installation, Réparation..."
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template-description-mobile">Description</Label>
              <span className="text-xs text-muted-foreground">
                {editedDescription.length}/2000
              </span>
            </div>
            <Textarea
              id="template-description-mobile"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value.slice(0, 2000))}
              rows={8}
              className="resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {count}/{maxTemplates} templates sauvegardés
          </p>
        </div>

        <SheetFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
