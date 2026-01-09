'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, ArrowLeft, Trash2, Save, FileText, TrendingDown, Calendar, Send, CheckCircle2, Download, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreditNote {
  id: string
  credit_note_number: string
  client_id: string | null
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  client_siret?: string
  invoice_id?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'finalized'
  issue_date: string
  sent_at?: string
  reason?: string
  notes?: string
  items?: CreditNoteItem[]
}

interface CreditNoteItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: FileText },
  sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  finalized: { label: 'Finalisé', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
}

export default function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [creditNote, setCreditNote] = useState<CreditNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      loadCreditNote(p.id)
    })
  }, [])

  const loadCreditNote = async (creditNoteId: string) => {
    try {
      const response = await fetch(`/api/credit-notes/${creditNoteId}`)
      if (response.ok) {
        const data = await response.json()
        setCreditNote(data.creditNote)
      } else {
        toast.error('Avoir non trouvé')
        router.push('/dashboard/avoirs')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!creditNote) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/credit-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditNote),
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      const data = await response.json()
      setCreditNote(data.creditNote)
      toast.success('✅ Avoir mis à jour')
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/credit-notes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Erreur lors de la suppression')
        return
      }

      toast.success('✅ Avoir supprimé')
      router.push('/dashboard/avoirs')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const markAsSent = async () => {
    if (!creditNote) return

    try {
      const response = await fetch(`/api/credit-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      setCreditNote(data.creditNote)
      toast.success('✅ Avoir marqué comme envoyé')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const markAsFinalized = async () => {
    if (!creditNote) return

    try {
      const response = await fetch(`/api/credit-notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'finalized',
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur')
      }

      const data = await response.json()
      setCreditNote(data.creditNote)
      toast.success('✅ Avoir marqué comme finalisé')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Avoir" description="Chargement..." />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LayoutContainer>
    )
  }

  if (!creditNote) {
    return null
  }

  const StatusIcon = statusConfig[creditNote.status].icon

  return (
    <LayoutContainer>
      <PageHeader title="Avoir" description={creditNote.credit_note_number} />

      <div className="max-w-4xl space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Statut et actions rapides */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium">{creditNote.credit_note_number}</p>
                  <span className={cn(
                    'inline-block text-xs font-medium px-2 py-1 rounded-full',
                    statusConfig[creditNote.status].color
                  )}>
                    {statusConfig[creditNote.status].label}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {creditNote.status === 'draft' && (
                  <>
                    <Button size="sm" variant="outline" onClick={markAsSent}>
                      <Send className="mr-2 h-4 w-4" />
                      Marquer envoyé
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </>
                )}
                {creditNote.status === 'sent' && (
                  <Button size="sm" onClick={markAsFinalized}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Finaliser
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations client */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">{creditNote.client_name}</p>
              </div>
              {creditNote.client_email && (
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{creditNote.client_email}</p>
                </div>
              )}
              {creditNote.client_phone && (
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{creditNote.client_phone}</p>
                </div>
              )}
              {creditNote.client_siret && (
                <div>
                  <Label className="text-muted-foreground">SIRET</Label>
                  <p className="font-medium">{creditNote.client_siret}</p>
                </div>
              )}
            </div>
            {creditNote.client_address && (
              <div>
                <Label className="text-muted-foreground">Adresse</Label>
                <p className="font-medium">{creditNote.client_address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates et raison */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'émission
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={creditNote.issue_date}
                    onChange={(e) => setCreditNote({ ...creditNote, issue_date: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">
                    {new Date(creditNote.issue_date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              {creditNote.sent_at && (
                <div>
                  <Label className="text-muted-foreground">Date d'envoi</Label>
                  <p className="font-medium">
                    {new Date(creditNote.sent_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-muted-foreground">Raison de l'avoir</Label>
              {isEditing ? (
                <Textarea
                  value={creditNote.reason || ''}
                  onChange={(e) => setCreditNote({ ...creditNote, reason: e.target.value })}
                  rows={3}
                />
              ) : (
                <p className="font-medium">{creditNote.reason || 'Non spécifiée'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lignes de l'avoir */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Détail de l'avoir</h3>
            <div className="space-y-2">
              {creditNote.items?.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-start py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.abs(item.quantity)} × {Math.abs(item.unit_price).toFixed(2)} €
                    </p>
                  </div>
                  <p className="font-medium text-red-600">-{Math.abs(item.total).toFixed(2)} €</p>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT :</span>
                <span className="font-medium text-red-600">-{Math.abs(creditNote.subtotal).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({creditNote.tax_rate}%) :</span>
                <span className="font-medium text-red-600">-{Math.abs(creditNote.tax_amount).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total TTC :</span>
                <span className="text-red-600">-{Math.abs(creditNote.total).toFixed(2)} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {(creditNote.notes || isEditing) && (
          <Card>
            <CardContent className="p-6">
              <Label className="text-muted-foreground">Notes internes</Label>
              {isEditing ? (
                <Textarea
                  value={creditNote.notes || ''}
                  onChange={(e) => setCreditNote({ ...creditNote, notes: e.target.value })}
                  placeholder="Notes internes..."
                  rows={3}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2">{creditNote.notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="destructive" 
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'avoir</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'avoir {creditNote.credit_note_number} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
