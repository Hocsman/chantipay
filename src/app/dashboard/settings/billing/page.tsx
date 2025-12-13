'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'

const plans = [
  {
    id: 'solo',
    name: 'Artisan Solo',
    price: 19,
    description: 'Idéal pour les artisans indépendants',
    features: [
      'Devis illimités',
      'Signature électronique',
      'Paiement par acompte',
      'Export PDF',
      'Assistant IA',
    ],
    recommended: false,
  },
  {
    id: 'team',
    name: 'Petite Équipe',
    price: 39,
    description: 'Pour les équipes jusqu\'à 5 personnes',
    features: [
      'Tout du plan Solo',
      'Jusqu\'à 5 utilisateurs',
      'Gestion des équipes',
      'Rapports avancés',
      'Support prioritaire',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: 79,
    description: 'Pour les grandes structures',
    features: [
      'Tout du plan Équipe',
      'Utilisateurs illimités',
      'API personnalisée',
      'Intégration comptable',
      'Account manager dédié',
    ],
    recommended: false,
  },
]

const invoices = [
  { id: '1', date: '01/12/2024', amount: 19, status: 'paid' },
  { id: '2', date: '01/11/2024', amount: 19, status: 'paid' },
  { id: '3', date: '01/10/2024', amount: 19, status: 'paid' },
]

export default function BillingPage() {
  const router = useRouter()
  const [currentPlan] = useState('solo')
  const [isLoading, setIsLoading] = useState(false)

  const handleChangePlan = async (planId: string) => {
    if (planId === currentPlan) return
    
    setIsLoading(true)
    try {
      // TODO: Appeler l'API Stripe pour changer de plan
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // Rediriger vers Stripe Checkout ou afficher une confirmation
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManagePaymentMethod = async () => {
    setIsLoading(true)
    try {
      // TODO: Rediriger vers le portail client Stripe
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsLoading(false)
    }
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
        {/* Statut actuel */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Votre abonnement</CardTitle>
                <CardDescription>Plan Artisan Solo • 19€/mois</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Période d&apos;essai
                </p>
                <p className="text-sm text-amber-700">
                  Votre essai gratuit se termine dans 14 jours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans disponibles */}
        <Card>
          <CardHeader>
            <CardTitle>Changer de plan</CardTitle>
            <CardDescription>
              Choisissez le plan qui correspond à vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.recommended
                      ? 'border-primary shadow-md'
                      : currentPlan === plan.id
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
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold">{plan.price}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={currentPlan === plan.id ? 'outline' : 'default'}
                      disabled={currentPlan === plan.id || isLoading}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      {currentPlan === plan.id ? 'Plan actuel' : 'Choisir ce plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Moyen de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Moyen de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expire 12/25</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleManagePaymentMethod}>
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Historique des factures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Historique des factures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">Facture #{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}€</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Payée
                    </Badge>
                    <Button variant="ghost" size="sm">
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Annuler l'abonnement */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Annuler l&apos;abonnement</p>
                <p className="text-sm text-muted-foreground">
                  Votre accès sera maintenu jusqu&apos;à la fin de la période
                </p>
              </div>
              <Button variant="destructive" disabled>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />
        
        <div className="pb-24" />
      </div>
    </LayoutContainer>
  )
}
