'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUserTemplates } from '@/hooks/useUserTemplates'

interface SaveTemplateDialogProps {
  description: string
  trade: string
  disabled?: boolean
}

export function SaveTemplateDialog({
  description,
  trade,
  disabled,
}: SaveTemplateDialogProps) {
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
        description: `"${title}" a été ajouté à vos templates personnalisés`,
      })
      setOpen(false)
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }

    setIsSaving(false)
  }

  const isDisabled = disabled || !description.trim() || description.trim().length < 20

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isDisabled}
          title={isDisabled ? 'Ajoutez une description de 20 caractères minimum' : 'Sauvegarder comme template'}
        >
          <Save className="h-4 w-4 mr-1" />
          Sauvegarder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sauvegarder comme template</DialogTitle>
          <DialogDescription>
            Créez un template réutilisable à partir de cette description
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-title">Titre du template *</Label>
            <Input
              id="template-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Installation chauffe-eau 200L"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Catégorie</Label>
            <Input
              id="template-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Installation, Réparation..."
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template-description">Description</Label>
              <span className="text-xs text-muted-foreground">
                {editedDescription.length}/2000
              </span>
            </div>
            <Textarea
              id="template-description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value.slice(0, 2000))}
              rows={6}
              className="resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {count}/{maxTemplates} templates sauvegardés
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
