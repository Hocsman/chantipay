import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Sparkles } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Tarifs ChantiPay : Solo, Petite équipe (Bêta) | Devis mobile',
  description:
    'Choisissez votre formule ChantiPay : devis illimités, signature au doigt, PDF pro, suivi d\'acompte. Comparez les tarifs et testez la démo.',
  alternates: {
    canonical: `${BASE_URL}/tarifs`,
  },
}

const faqs = [
  {
    question: 'Y a-t-il un engagement de durée ?',
    answer:
      'Non, ChantiPay est sans engagement. Vous pouvez annuler votre abonnement à tout moment depuis votre espace client.',
  },
  {
    question: 'Puis-je tester gratuitement avant de payer ?',
    answer:
      'Oui, vous bénéficiez de 14 jours d\'essai gratuit sans carte bancaire. Vous avez accès à toutes les fonctionnalités pour tester l\'application.',
  },
  {
    question: 'Y a-t-il des frais sur les paiements encaissés ?',
    answer:
      'ChantiPay ne prélève aucune commission sur vos acomptes. Les seuls frais éventuels sont ceux de votre banque ou de Stripe si vous utilisez le paiement en ligne.',
  },
  {
    question: 'Quelle est la différence entre Solo et Petite équipe ?',
    answer:
      'L\'offre Solo est pour un seul utilisateur. L\'offre Petite équipe (en bêta) permet jusqu\'à 5 comptes utilisateurs avec un tableau de bord partagé.',
  },
  {
    question: 'Comment fonctionne la facturation ?',
    answer:
      'La facturation est mensuelle. Vous recevez une facture par email chaque mois. Vous pouvez payer par carte bancaire via Stripe.',
  },
]

export default function TarifsPage() {
  return (
    <SeoPageLayout
      currentPath="/tarifs"
      faqs={faqs}
      ctaTitle="Prêt à tester ?"
      ctaSubtitle="14 jours d'essai gratuit, sans carte bancaire."
    >
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Tarifs simples et transparents
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Pas de frais cachés, pas de commission sur vos paiements. Choisissez
            la formule adaptée à votre activité.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Solo */}
            <Card>
              <CardHeader>
                <CardTitle>Artisan Solo</CardTitle>
                <CardDescription>Pour les indépendants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">19€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Devis illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      <Link
                        href="/signature-devis-electronique"
                        className="hover:text-primary"
                      >
                        Signature électronique
                      </Link>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>PDF professionnel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      <Link
                        href="/acompte-chantier"
                        className="hover:text-primary"
                      >
                        Suivi d&apos;acompte
                      </Link>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>50 générations IA/mois</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Support par email</span>
                  </li>
                </ul>
                <Link href="/register">
                  <Button className="w-full">Essai gratuit 14 jours</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Équipe */}
            <Card className="border-purple-300 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-purple-600 hover:bg-purple-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Bêta
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>Petite équipe</CardTitle>
                <CardDescription>Jusqu&apos;à 5 utilisateurs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">39€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Tout de Artisan Solo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>5 comptes utilisateurs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>200 générations IA/mois</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Tableau de bord équipe</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>⚠️</span>
                    <span>Fonctionnalités en déploiement</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full" asChild>
                  <a href="mailto:contact@chantipay.com?subject=Accès%20bêta%20Petite%20équipe">
                    Rejoindre la bêta
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Garanties */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Nos garanties</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">Sans engagement</h3>
              <p className="text-sm text-muted-foreground">
                Annulez à tout moment, sans frais.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">💳</div>
              <h3 className="font-semibold mb-1">Essai sans CB</h3>
              <p className="text-sm text-muted-foreground">
                14 jours gratuits, aucune carte requise.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-semibold mb-1">Support réactif</h3>
              <p className="text-sm text-muted-foreground">
                Une question ? On vous répond rapidement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités incluses */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Toutes les fonctionnalités incluses
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/devis-sur-mobile"
              className="p-4 bg-white border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold">📱 Devis sur mobile</h3>
              <p className="text-sm text-muted-foreground">
                Créez vos devis depuis votre smartphone.
              </p>
            </Link>
            <Link
              href="/signature-devis-electronique"
              className="p-4 bg-white border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold">✍️ Signature au doigt</h3>
              <p className="text-sm text-muted-foreground">
                Faites signer sur place, trace dans le PDF.
              </p>
            </Link>
            <Link
              href="/modele-devis-artisan"
              className="p-4 bg-white border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold">📄 PDF professionnel</h3>
              <p className="text-sm text-muted-foreground">
                Générez des devis avec mentions légales.
              </p>
            </Link>
            <Link
              href="/acompte-chantier"
              className="p-4 bg-white border rounded-lg hover:border-primary transition-colors"
            >
              <h3 className="font-semibold">💰 Suivi d&apos;acompte</h3>
              <p className="text-sm text-muted-foreground">
                Demandez et suivez vos acomptes.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
