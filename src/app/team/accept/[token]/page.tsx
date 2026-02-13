'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Building2, UserCheck, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface InvitationDetails {
  email: string
  firstName: string
  lastName: string
  roleTitle: string
  companyName: string
  ownerName: string
}

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null)
  const [acceptSuccess, setAcceptSuccess] = useState(false)

  // Vérifier l'état d'authentification et charger l'invitation
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      // Vérifier si l'utilisateur est connecté
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setCurrentUser({ email: user.email || '' })
      }

      // Charger les détails de l'invitation
      try {
        const response = await fetch(`/api/team/accept/${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invitation non trouvée')
        } else {
          setInvitation(data.invitation)
        }
      } catch (err) {
        setError('Erreur lors du chargement de l\'invitation')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [token])

  // Accepter l'invitation
  const handleAccept = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const response = await fetch(`/api/team/accept/${token}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.expectedEmail) {
          setError(`Veuillez vous connecter avec l'adresse ${data.expectedEmail}`)
        } else {
          setError(data.error || 'Erreur lors de l\'acceptation')
        }
        return
      }

      setAcceptSuccess(true)

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push(data.redirect || '/mobile')
      }, 2000)
    } catch (err) {
      setError('Erreur lors de l\'acceptation de l\'invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Chargement de l'invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Erreur ou invitation non valide
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Succès de l'acceptation
  if (acceptSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Bienvenue dans l'équipe !</CardTitle>
            <CardDescription>
              Vous avez rejoint {invitation?.companyName}. Redirection en cours...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Afficher les détails de l'invitation
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Invitation à rejoindre une équipe</CardTitle>
          <CardDescription>
            Vous avez été invité(e) à rejoindre l'équipe de{' '}
            <strong>{invitation?.companyName}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Détails de l'invitation */}
          <div className="rounded-lg border p-4 space-y-3">
            {invitation?.ownerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invité par</span>
                <span className="font-medium">{invitation.ownerName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Votre fonction</span>
              <span className="font-medium">{invitation?.roleTitle || 'Membre'}</span>
            </div>
            {invitation?.firstName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nom</span>
                <span className="font-medium">
                  {invitation.firstName} {invitation.lastName}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{invitation?.email}</span>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Actions selon l'état d'authentification */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Connecté en tant que <strong>{currentUser.email}</strong>
                  </span>
                </div>
              </div>

              {currentUser.email.toLowerCase() === invitation?.email.toLowerCase() ? (
                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full"
                  size="lg"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Acceptation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accepter l'invitation
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Vous devez vous connecter avec l'adresse{' '}
                    <strong>{invitation?.email}</strong> pour accepter cette invitation.
                  </p>
                  <Link href={`/login?redirect=/team/accept/${token}`}>
                    <Button variant="outline" className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Se connecter avec un autre compte
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Pour accepter cette invitation, vous devez vous connecter ou créer un compte
                avec l'adresse <strong>{invitation?.email}</strong>.
              </p>

              <Link href={`/login?redirect=/team/accept/${token}&email=${encodeURIComponent(invitation?.email || '')}`}>
                <Button className="w-full" size="lg">
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
              </Link>

              <Link href={`/register?redirect=/team/accept/${token}&email=${encodeURIComponent(invitation?.email || '')}`}>
                <Button variant="outline" className="w-full" size="lg">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer un compte
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
