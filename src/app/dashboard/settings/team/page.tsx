'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  UserPlus,
  Users,
  MoreVertical,
  Mail,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  TeamMember,
  TeamMemberPermissions,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  DEFAULT_PERMISSIONS,
  PermissionKey,
  InvitationStatus,
} from '@/types/team'

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Formulaire d'invitation
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleTitle: 'Technicien',
  })
  const [invitePermissions, setInvitePermissions] = useState<Record<PermissionKey, boolean>>(
    { ...DEFAULT_PERMISSIONS }
  )

  // Formulaire d'édition
  const [editPermissions, setEditPermissions] = useState<Record<PermissionKey, boolean>>(
    { ...DEFAULT_PERMISSIONS }
  )

  // Charger les membres
  const loadMembers = async () => {
    try {
      const response = await fetch('/api/team/members')
      if (!response.ok) throw new Error('Erreur chargement')
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des membres')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  // Envoyer une invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteForm.email) {
      toast.error('L\'email est requis')
      return
    }

    setIsInviting(true)
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          phone: inviteForm.phone,
          roleTitle: inviteForm.roleTitle,
          permissions: invitePermissions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      toast.success(`Invitation envoyée à ${inviteForm.email}`)

      // Réinitialiser le formulaire
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleTitle: 'Technicien',
      })
      setInvitePermissions({ ...DEFAULT_PERMISSIONS })

      // Recharger la liste
      loadMembers()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'invitation')
    } finally {
      setIsInviting(false)
    }
  }

  // Ouvrir le dialog d'édition
  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    if (member.permissions) {
      const perms: Record<PermissionKey, boolean> = { ...DEFAULT_PERMISSIONS }
      for (const key of PERMISSION_KEYS) {
        perms[key] = member.permissions[key] ?? false
      }
      setEditPermissions(perms)
    } else {
      setEditPermissions({ ...DEFAULT_PERMISSIONS })
    }
    setIsEditDialogOpen(true)
  }

  // Sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!selectedMember) return

    try {
      const response = await fetch(`/api/team/members/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Permissions mises à jour')
      setIsEditDialogOpen(false)
      loadMembers()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    }
  }

  // Supprimer un membre
  const handleDelete = async () => {
    if (!selectedMember) return

    try {
      const response = await fetch(`/api/team/members/${selectedMember.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Membre supprimé')
      setIsDeleteDialogOpen(false)
      setSelectedMember(null)
      loadMembers()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  // Renvoyer une invitation
  const handleResendInvite = async (member: TeamMember) => {
    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: member.email,
          firstName: member.first_name,
          lastName: member.last_name,
          phone: member.phone,
          roleTitle: member.role_title,
          permissions: member.permissions || DEFAULT_PERMISSIONS,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur')
      }

      toast.success('Invitation renvoyée')
      loadMembers()
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du renvoi')
    }
  }

  // Badge de statut
  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case 'accepted':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Acceptée
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
            <XCircle className="h-3 w-3 mr-1" />
            Expirée
          </Badge>
        )
      case 'revoked':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">
            <XCircle className="h-3 w-3 mr-1" />
            Révoquée
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <PageHeader
        title="Gestion d'équipe"
        description="Invitez des membres et gérez leurs permissions"
      />

      <div className="space-y-6">
        {/* Formulaire d'invitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Inviter un membre
            </CardTitle>
            <CardDescription>
              Envoyez une invitation par email pour ajouter un nouveau membre à votre équipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="technicien@exemple.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleTitle">Fonction</Label>
                  <Input
                    id="roleTitle"
                    value={inviteForm.roleTitle}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleTitle: e.target.value })}
                    placeholder="Technicien"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    placeholder="Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PERMISSION_KEYS.map((key) => (
                    <div
                      key={key}
                      className="flex items-start space-x-3 rounded-lg border p-3"
                    >
                      <Checkbox
                        id={`invite-${key}`}
                        checked={invitePermissions[key]}
                        onCheckedChange={(checked) =>
                          setInvitePermissions({ ...invitePermissions, [key]: !!checked })
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <label
                          htmlFor={`invite-${key}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {PERMISSION_LABELS[key].label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {PERMISSION_LABELS[key].description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer l'invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Liste des membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres de l'équipe
              {members.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {members.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Gérez les membres de votre équipe et leurs permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun membre dans votre équipe</p>
                <p className="text-sm">Invitez votre premier membre ci-dessus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email}
                        </span>
                        {getStatusBadge(member.invitation_status)}
                        {!member.is_active && (
                          <Badge variant="destructive">Désactivé</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {member.email}
                        {member.role_title && ` • ${member.role_title}`}
                      </p>
                      {member.permissions && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {PERMISSION_KEYS.filter((key) => member.permissions?.[key]).map(
                            (key) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[key].label}
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(member)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier les permissions
                        </DropdownMenuItem>
                        {member.invitation_status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renvoyer l'invitation
                          </DropdownMenuItem>
                        )}
                        {member.invitation_status === 'expired' && (
                          <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Réinviter
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(member)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'édition des permissions */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier les permissions</DialogTitle>
            <DialogDescription>
              {selectedMember?.first_name && selectedMember?.last_name
                ? `${selectedMember.first_name} ${selectedMember.last_name}`
                : selectedMember?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2 py-4">
            {PERMISSION_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-start space-x-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={`edit-${key}`}
                  checked={editPermissions[key]}
                  onCheckedChange={(checked) =>
                    setEditPermissions({ ...editPermissions, [key]: !!checked })
                  }
                />
                <div className="space-y-1 leading-none">
                  <label
                    htmlFor={`edit-${key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {PERMISSION_LABELS[key].label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {PERMISSION_LABELS[key].description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>
                {selectedMember?.first_name && selectedMember?.last_name
                  ? `${selectedMember.first_name} ${selectedMember.last_name}`
                  : selectedMember?.email}
              </strong>{' '}
              de votre équipe ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LayoutContainer>
  )
}
