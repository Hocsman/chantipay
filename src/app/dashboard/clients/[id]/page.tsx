'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Plus,
  FileText,
  Trash2,
  Loader2,
  Pencil,
  X,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
  notes?: string | null
  created_at: string
}

interface Quote {
  id: string
  quote_number: string
  status: 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled'
  total_ttc: number
  created_at: string
}

const statusConfig = {
  draft: { label: 'Brouillon', variant: 'secondary' as const },
  sent: { label: 'Envoyé', variant: 'outline' as const },
  signed: { label: 'Signé', variant: 'default' as const },
  deposit_paid: { label: 'Acompte payé', variant: 'default' as const },
  completed: { label: 'Terminé', variant: 'default' as const },
  canceled: { label: 'Annulé', variant: 'destructive' as const },
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    postal_code: '',
    city: '',
    notes: '',
  })

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      setLoading(true)

      // Charger le client
      const clientRes = await fetch(`/api/clients/${clientId}`)
      if (!clientRes.ok) {
        if (clientRes.status === 404) {
          toast.error('Client introuvable')
          router.push('/dashboard/clients')
          return
        }
        throw new Error('Erreur lors du chargement du client')
      }
      const clientData = await clientRes.json()
      const clientInfo = clientData.client || clientData
      setClient(clientInfo)
      
      // Initialiser le formulaire avec les données du client
      setFormData({
        name: clientInfo.name || '',
        email: clientInfo.email || '',
        phone: clientInfo.phone || '',
        address_line1: clientInfo.address_line1 || '',
        postal_code: clientInfo.postal_code || '',
        city: clientInfo.city || '',
        notes: clientInfo.notes || '',
      })

      // Charger les devis du client
      const quotesRes = await fetch(`/api/quotes?client_id=${clientId}`)
      if (quotesRes.ok) {
        const quotesData = await quotesRes.json()
        setQuotes(quotesData)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!client) return

    if (!formData.name.trim()) {
      toast.error('Le nom du client est requis')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la mise à jour')
        return
      }

      toast.success('✅ Client mis à jour avec succès')
      setIsEditing(false)
      await loadClientData()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Réinitialiser le formulaire avec les données du client
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address_line1: client.address_line1 || '',
        postal_code: client.postal_code || '',
        city: client.city || '',
        notes: client.notes || '',
      })
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      toast.success('✅ Client supprimé', {
        description: 'Le client a été supprimé avec succès',
      })

      router.push('/dashboard/clients')
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      toast.error('❌ Erreur', {
        description: error.message || 'Impossible de supprimer le client',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <LayoutContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutContainer>
    )
  }

  if (!client) {
    return (
      <LayoutContainer>
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <p className="text-muted-foreground mb-4">Client introuvable</p>
          <Link href="/dashboard/clients">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Button>
          </Link>
        </div>
      </LayoutContainer>
    )
  }

  // Formater la date de création
  const formatCreatedAt = (dateString: string) => {
    if (!dateString) return 'Date inconnue'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Date inconnue'
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <LayoutContainer>
      <div className="mb-4">
        <Link
          href="/dashboard/clients"
          className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux clients
        </Link>
      </div>

      <PageHeader
        title={client.name}
        description={`Client depuis le ${formatCreatedAt(client.created_at)}`}
      >
        <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Créer un devis
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Coordonnées</CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode lecture */}
              {!isEditing && (
                <>
                  {client.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <a
                          href={`mailto:${client.email}`}
                          className="text-primary text-sm hover:underline"
                        >
                          {client.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Téléphone</p>
                        <a
                          href={`tel:${client.phone}`}
                          className="text-primary text-sm hover:underline"
                        >
                          {client.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {(client.address_line1 || client.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">Adresse</p>
                        <p className="text-muted-foreground text-sm">
                          {client.address_line1}
                          {client.address_line1 && <br />}
                          {client.address_line2}
                          {client.address_line2 && <br />}
                          {client.postal_code} {client.city}
                          {client.country && (
                            <>
                              <br />
                              {client.country}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {!client.email && !client.phone && !client.address_line1 && !client.city && (
                    <p className="text-muted-foreground text-sm italic">
                      Aucune coordonnée renseignée
                    </p>
                  )}
                  {client.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-1 text-sm font-medium">Notes</p>
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Mode édition */}
              {isEditing && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSave()
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nom du client"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="client@email.com"
                      value={formData.email}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={formData.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Adresse</Label>
                    <Input
                      id="address_line1"
                      name="address_line1"
                      placeholder="123 rue de la République"
                      value={formData.address_line1}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        placeholder="75001"
                        value={formData.postal_code}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Paris"
                        value={formData.city}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Notes ou informations complémentaires..."
                      value={formData.notes}
                      onChange={handleFormChange}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Zone de danger - Suppression */}
          <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 dark:text-red-400">
                Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  La suppression du client est définitive et irréversible.
                </p>
                {quotes.length > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
                    ⚠️ Ce client a {quotes.length} devis associé
                    {quotes.length > 1 ? 's' : ''}. Ils seront également supprimés.
                  </p>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quotes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Devis</CardTitle>
              <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau devis
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {quotes.length > 0 ? (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/dashboard/quotes/${quote.id}`}
                      className="block"
                    >
                      <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="text-muted-foreground h-5 w-5" />
                          <div>
                            <p className="font-medium">{quote.quote_number}</p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(quote.created_at).toLocaleDateString(
                                'fr-FR'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-medium">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(quote.total_ttc)}
                          </p>
                          <Badge variant={statusConfig[quote.status].variant}>
                            {statusConfig[quote.status].label}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                  <p className="text-muted-foreground mb-4">
                    Aucun devis pour ce client
                  </p>
                  <Link href={`/dashboard/quotes/new?clientId=${client.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un devis
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer <strong>{client.name}</strong> ?
              </p>
              {quotes.length > 0 && (
                <p className="text-amber-600 dark:text-amber-400">
                  ⚠️ Attention : Ce client a {quotes.length} devis associé
                  {quotes.length > 1 ? 's' : ''} qui sera
                  {quotes.length > 1 ? 'ont' : ''} également supprimé
                  {quotes.length > 1 ? 's' : ''}.
                </p>
              )}
              <p className="font-semibold">Cette action est irréversible.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
