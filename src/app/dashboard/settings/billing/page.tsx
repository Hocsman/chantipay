'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/PageHeader'
import { LayoutContainer } from '@/components/LayoutContainer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Check,
  CreditCard,
  Receipt,
  AlertCircle,
  Mail,
  Sparkles,
  Loader2,
  Settings,
  CheckCircle,
  XCircle,
} from 'lucide-react'

// Plan types for better type safety
type PlanBadge = 'disponible' | 'beta' | 'sur-devis'
type SubscriptionPlan = 'solo' | 'team' | null

interface Plan {
  id: string
  name: string
  price: number | null
  priceLabel?: string
  description: string
  features: string[]
  recommended: boolean
  badge: PlanBadge
}

interface UserSubscription {
  subscription_status: string
  subscription_plan: SubscriptionPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
}

const plans: Plan[] = [
  {
    id: 'solo',
    name: 'Artisan Solo',
    price: 19,
    description: 'Idéal pour les artisans indépendants',
    features: [
      'Devis illimités',
      'Signature électronique',
      'Paiement par acompte',
      'Export PDF professionnel',
      'Assistant IA intégré',
    ],
    recommended: false,
    badge: 'disponible',
  },
  {
    id: 'team',
    name: 'Petite Équipe',
    price: 39,
    description: 'Pour les équipes jusqu\'à 5 personnes',
    features: [
      'Accès multi-utilisateurs (jusqu\'à 5)',
      'Partage clients & devis',
      'Rôles & permissions',
      'Historique des actions',
      'Support prioritaire',
    ],
    recommended: true,
    badge: 'disponible', // Now available for purchase
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: null,
    priceLabel: 'Sur devis',
    description: 'Pour les grandes structures',
    features: [
      'Utilisateurs illimités',
      'Export CSV compta',
      'Rôles & permissions avancés',
      'Accès multi-entreprises',
      'Account manager dédié',
    ],
    recommended: false,
    badge: 'sur-devis',
  },
]

// Badge component for plan availability
function PlanBadgeComponent({ type }: { type: PlanBadge }) {
  switch (type) {
    case 'disponible':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Disponible
        </Badge>
      )
    case 'beta':
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Bêta
        </Badge>
      )
    case 'sur-devis':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Mail className="h-3 w-3 mr-1" />
          Sur devis
        </Badge>
      )
  }
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Actif
        </Badge>
      )
    case 'trial':
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Sparkles className="h-3 w-3 mr-1" />
          Essai
        </Badge>
      )
    case 'past_due':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Paiement en retard
        </Badge>
      )
    case 'canceled':
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          Annulé
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      )
  }
}

// Main billing content component
function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check for success/canceled query params
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessMessage('🎉 Abonnement activé avec succès !')
      // Clear the query params
      router.replace('/dashboard/settings/billing')
    }
    if (searchParams.get('canceled') === '1') {
      setError('Paiement annulé. Vous pouvez réessayer quand vous voulez.')
      router.replace('/dashboard/settings/billing')
    }
  }, [searchParams, router])

  // Fetch user subscription data
  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_plan, stripe_customer_id, stripe_subscription_id, current_period_end')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setSubscription(profile)
    } catch (err) {
      console.error('Error loading subscription:', err)
      setError('Erreur lors du chargement de l\'abonnement')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  // Handle checkout for a plan
  const handleCheckout = async (planId: string) => {
    if (planId === 'enterprise') return
    
    setCheckoutLoading(planId)
    setError(null)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement')
    } finally {
      setCheckoutLoading(null)
    }
  }

  // Handle billing portal redirect
  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'accès au portail')
      }

      // Redirect to Stripe Billing Portal
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error ? err.message : 'Erreur d\'accès au portail')
    } finally {
      setPortalLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  // Get current plan details
  const currentPlan = subscription?.subscription_plan
  const currentPlanDetails = plans.find(p => p.id === currentPlan)
  const hasActiveSubscription = subscription?.subscription_status === 'active'
  const isInTrial = subscription?.subscription_status === 'trial'

  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Facturation"
          description="Gérez votre abonnement et vos paiements"
        />
      </div>

      <div className="space-y-6">
        {/* Success/Error messages */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setSuccessMessage(null)}
            >
              ✕
            </Button>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto"
              onClick={() => setError(null)}
            >
              ✕
            </Button>
          </div>
        )}

        {/* Statut actuel */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle>Votre abonnement</CardTitle>
                <CardDescription>
                  {currentPlanDetails 
                    ? `Plan ${currentPlanDetails.name} • ${currentPlanDetails.price}€/mois`
                    : 'Aucun plan actif'
                  }
                </CardDescription>
              </div>
              <StatusBadge status={subscription?.subscription_status || 'trial'} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trial warning */}
            {isInTrial && (
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Période d&apos;essai
                  </p>
                  <p className="text-sm text-amber-700">
                    Votre essai gratuit est actif. Choisissez un plan pour continuer à utiliser ChantiPay.
                  </p>
                </div>
              </div>
            )}

            {/* Past due warning */}
            {subscription?.subscription_status === 'past_due' && (
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Paiement en retard
                  </p>
                  <p className="text-sm text-red-700">
                    Veuillez mettre à jour votre moyen de paiement pour éviter une interruption de service.
                  </p>
                </div>
              </div>
            )}

            {/* Current period end */}
            {subscription?.current_period_end && hasActiveSubscription && (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <Receipt className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Prochain renouvellement le {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
            )}

            {/* Manage subscription button */}
            {subscription?.stripe_customer_id && (
              <Button 
                className="w-full sm:w-auto" 
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Gérer mon abonnement
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Plans disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>
              {hasActiveSubscription ? 'Changer de plan' : 'Choisir un plan'}
            </CardTitle>
            <CardDescription>
              Choisissez le plan qui correspond à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id && hasActiveSubscription
                const canPurchase = plan.badge === 'disponible' && !isCurrentPlan
                
                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.recommended
                        ? 'border-primary shadow-md'
                        : isCurrentPlan
                        ? 'border-primary/50 bg-primary/5'
                        : ''
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary">Recommandé</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <PlanBadgeComponent type={plan.badge} />
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        {plan.price !== null ? (
                          <>
                            <span className="text-3xl font-bold">{plan.price}€</span>
                            <span className="text-muted-foreground">/mois</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {plan.priceLabel}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {/* CTA buttons */}
                      {isCurrentPlan && (
                        <Button className="w-full" variant="outline" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Plan actuel
                        </Button>
                      )}
                      
                      {canPurchase && (
                        <Button
                          className="w-full"
                          onClick={() => handleCheckout(plan.id)}
                          disabled={checkoutLoading !== null}
                        >
                          {checkoutLoading === plan.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Redirection...
                            </>
                          ) : (
                            'Choisir ce plan'
                          )}
                        </Button>
                      )}
                      
                      {plan.badge === 'sur-devis' && (
                        <Button className="w-full" variant="outline" asChild>
                          <a href="mailto:contact@chantipay.com?subject=Offre%20Entreprise%20ChantiPay">
                            <Mail className="h-4 w-4 mr-2" />
                            Contactez-nous
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Moyen de paiement - only show if has Stripe customer */}
        {subscription?.stripe_customer_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Moyen de paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-muted-foreground">
                  Gérez vos moyens de paiement via le portail Stripe
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full sm:w-auto"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique des factures - via portal */}
        {subscription?.stripe_customer_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Historique des factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-muted-foreground">
                  Consultez et téléchargez vos factures via le portail Stripe
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full sm:w-auto"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Receipt className="h-4 w-4 mr-2" />
                  )}
                  Voir les factures
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />
        
        <div className="pb-24" />
      </div>
    </LayoutContainer>
  )
}

// Loading fallback for Suspense
function BillingLoading() {
  return (
    <LayoutContainer>
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    </LayoutContainer>
  )
}

// Export default with Suspense wrapper
export default function BillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingContent />
    </Suspense>
  )
}
