'use client'

import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Landmark, ArrowRight, Building2, CreditCard, PiggyBank, TrendingUp } from 'lucide-react'

export default function BankingPage() {
  const features = [
    {
      icon: Building2,
      title: 'Synchronisation bancaire',
      description: 'Connectez vos comptes bancaires pour importer automatiquement vos transactions.',
    },
    {
      icon: CreditCard,
      title: 'Rapprochement automatique',
      description: 'Rapprochez automatiquement vos factures avec vos encaissements bancaires.',
    },
    {
      icon: PiggyBank,
      title: 'Suivi de trésorerie',
      description: 'Visualisez en temps réel l\'état de votre trésorerie et anticipez vos besoins.',
    },
    {
      icon: TrendingUp,
      title: 'Prévisions financières',
      description: 'Anticipez vos flux de trésorerie grâce aux prévisions intelligentes.',
    },
  ]

  return (
    <LayoutContainer>
      <PageHeader
        title="Module Bancaire"
        description="Connectez vos comptes bancaires pour automatiser votre gestion financière"
      />

      <div className="max-w-4xl">
        {/* Coming Soon Banner */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Landmark className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">Bientôt disponible</h2>
              <p className="text-muted-foreground">
                Le module bancaire est en cours de développement. Vous serez notifié dès qu'il sera disponible.
                Cette fonctionnalité vous permettra de connecter vos comptes bancaires via une API sécurisée.
              </p>
            </div>
            <Button disabled className="whitespace-nowrap">
              <span>Activer</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-muted/30" />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Comment ça fonctionne ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Connexion sécurisée</h4>
                <p className="text-sm text-muted-foreground">
                  Connectez vos comptes bancaires via notre partenaire agréé. Vos identifiants ne sont jamais stockés.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Import automatique</h4>
                <p className="text-sm text-muted-foreground">
                  Vos transactions sont importées quotidiennement et catégorisées automatiquement.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Rapprochement intelligent</h4>
                <p className="text-sm text-muted-foreground">
                  ChantiPay rapproche automatiquement vos factures avec les paiements reçus.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutContainer>
  )
}
