import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { CreditCard, CheckCircle, Clock, Shield } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Acompte chantier : demander et suivre un acompte | ChantiPay',
  description:
    'Demandez un acompte avant travaux et suivez son statut (virement, cash, chèque). Devis signé + PDF pro. Découvrez ChantiPay.',
  alternates: {
    canonical: `${BASE_URL}/acompte-chantier`,
  },
}

const faqs = [
  {
    question: 'Quel pourcentage d\'acompte puis-je demander ?',
    answer:
      'Avec ChantiPay, vous pouvez configurer le pourcentage d\'acompte (20%, 30%, 40%, 50%). Le montant est automatiquement calculé et affiché sur le devis.',
  },
  {
    question: 'Comment le client paie-t-il l\'acompte ?',
    answer:
      'Le client peut payer par virement, espèces, chèque ou autre moyen. Vous marquez ensuite l\'acompte comme encaissé dans l\'application pour garder une trace.',
  },
  {
    question: 'Le montant de l\'acompte apparaît-il sur le PDF ?',
    answer:
      'Oui, le PDF du devis indique clairement le pourcentage et le montant de l\'acompte demandé, ainsi que les totaux HT et TTC.',
  },
  {
    question: 'Puis-je suivre les acomptes de tous mes devis ?',
    answer:
      'Oui, votre tableau de bord ChantiPay affiche le statut de chaque devis : en attente, signé, acompte reçu. Vous avez une vue d\'ensemble claire.',
  },
  {
    question: 'Que faire si le client ne paie pas l\'acompte ?',
    answer:
      'Le devis signé constitue un engagement. Vous pouvez relancer le client en lui renvoyant le PDF signé. L\'acompte est une pratique courante et légitime dans le bâtiment.',
  },
]

export default function AcompteChantierPage() {
  return (
    <SeoPageLayout currentPath="/acompte-chantier" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Acompte chantier : demandez et suivez facilement
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Sécurisez vos chantiers en demandant un acompte dès la signature du
            devis. Suivez les paiements et gardez une trace claire.
          </p>
        </div>
      </section>

      {/* Problème */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Les acomptes non payés, un vrai casse-tête
          </h2>
          <p className="text-muted-foreground mb-4">
            Vous commencez un chantier sans acompte, et le client fait traîner
            le paiement. Vous avez avancé les matériaux, le temps passe, et
            vous vous retrouvez à faire du recouvrement.
          </p>
          <p className="text-muted-foreground">
            Avec un acompte demandé dès la{' '}
            <Link
              href="/signature-devis-electronique"
              className="text-primary hover:underline"
            >
              signature du devis
            </Link>
            , vous sécurisez votre trésorerie et filtrez les clients sérieux.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            ChantiPay simplifie la gestion des acomptes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <CreditCard className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Acompte sur le devis</h3>
                <p className="text-sm text-muted-foreground">
                  Le pourcentage et le montant sont affichés clairement sur le
                  devis et le PDF.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <CheckCircle className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Marquez comme encaissé</h3>
                <p className="text-sm text-muted-foreground">
                  Indiquez le mode de paiement (virement, espèces, chèque) et
                  la date de réception.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <Clock className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Suivi en temps réel</h3>
                <p className="text-sm text-muted-foreground">
                  Voyez d&apos;un coup d&apos;œil quels acomptes sont en attente ou
                  encaissés.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Sécurité chantier</h3>
                <p className="text-sm text-muted-foreground">
                  Un acompte versé = un client engagé. Vous commencez serein.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Créez le devis</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos lignes et configurez le pourcentage d&apos;acompte
                (ex: 30%).
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Faites signer</h3>
              <p className="text-sm text-muted-foreground">
                Le client signe avec son doigt. L&apos;acompte demandé est indiqué
                sur le PDF.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Suivez le paiement</h3>
              <p className="text-sm text-muted-foreground">
                Marquez l&apos;acompte comme reçu dès que le client a payé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lien vers tarifs */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Inclus dans toutes les formules
          </h2>
          <p className="text-muted-foreground mb-4">
            Le suivi d&apos;acompte est disponible dès l&apos;offre Artisan Solo à
            19€/mois. Pas de frais cachés, pas de commission sur vos paiements.
          </p>
          <p className="text-muted-foreground">
            <Link href="/tarifs" className="text-primary hover:underline">
              Voir tous les tarifs ChantiPay →
            </Link>
          </p>
        </div>
      </section>
    </SeoPageLayout>
  )
}
