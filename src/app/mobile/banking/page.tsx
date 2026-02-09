'use client'

import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Landmark, ArrowRight, Building2, CreditCard, PiggyBank, TrendingUp } from 'lucide-react'

export default function MobileBankingPage() {
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
      description: 'Visualisez en temps réel l\'état de votre trésorerie.',
    },
    {
      icon: TrendingUp,
      title: 'Prévisions financières',
      description: 'Anticipez vos flux de trésorerie grâce aux prévisions intelligentes.',
    },
  ]

  return (
    <MobileLayout title="Bancaire" subtitle="Gestion financière">
      <div className="p-4 space-y-4">
        {/* Coming Soon Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bientôt disponible</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Le module bancaire est en cours de développement. Vous serez notifié dès qu'il sera disponible.
            </p>
            <Button disabled className="w-full">
              <span>Activer</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="space-y-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* How it works */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Comment ça fonctionne ?</h3>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-sm">Connexion sécurisée</h4>
                <p className="text-xs text-muted-foreground">
                  Connectez vos comptes via notre partenaire agréé.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-sm">Import automatique</h4>
                <p className="text-xs text-muted-foreground">
                  Vos transactions sont importées et catégorisées.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-sm">Rapprochement intelligent</h4>
                <p className="text-xs text-muted-foreground">
                  ChantiPay rapproche vos factures avec les paiements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}
