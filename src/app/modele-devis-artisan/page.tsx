import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { FileText, CheckCircle, Sparkles } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Modèle devis artisan (exemple) + générateur PDF | ChantiPay',
  description:
    'Exemple de devis artisan avec les mentions utiles + générateur pour créer un PDF pro en quelques clics. Signature au doigt et suivi d\'acompte.',
  alternates: {
    canonical: `${BASE_URL}/modele-devis-artisan`,
  },
}

const faqs = [
  {
    question: 'Quelles mentions obligatoires doit contenir un devis artisan ?',
    answer:
      'Un devis doit inclure : identité de l\'entreprise (nom, SIRET, adresse), coordonnées du client, date, description détaillée des travaux, prix unitaires et total HT/TTC, conditions de paiement et durée de validité.',
  },
  {
    question: 'Puis-je personnaliser le modèle de devis ?',
    answer:
      'Oui, ChantiPay vous permet de créer des devis avec vos propres lignes, prix et conditions. Votre logo et vos informations d\'entreprise sont automatiquement intégrés.',
  },
  {
    question: 'Le PDF généré est-il professionnel ?',
    answer:
      'Oui, le PDF inclut toutes les mentions légales, un design propre et professionnel, et la signature du client si le devis est signé.',
  },
  {
    question: 'Puis-je utiliser l\'IA pour générer les lignes du devis ?',
    answer:
      'Oui, ChantiPay intègre une IA qui génère automatiquement les lignes du devis à partir de votre description des travaux. Vous pouvez ensuite ajuster les prix.',
  },
  {
    question: 'Comment accéder aux modèles de devis ?',
    answer:
      'En créant un compte ChantiPay, vous accédez directement au générateur de devis. Pas besoin de télécharger un modèle Word ou Excel, tout se fait en ligne.',
  },
]

export default function ModeleDevisArtisanPage() {
  return (
    <SeoPageLayout currentPath="/modele-devis-artisan" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Modèle de devis artisan + générateur PDF
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Créez des devis professionnels en quelques clics. Toutes les
            mentions obligatoires sont incluses, plus la signature électronique
            et le suivi d&apos;acompte.
          </p>
        </div>
      </section>

      {/* Exemple de structure */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Structure d&apos;un devis artisan
          </h2>
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground">En-tête</p>
              <p className="font-semibold">
                Nom entreprise • SIRET • Adresse • Téléphone
              </p>
            </div>
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground">Client</p>
              <p>Nom du client • Adresse du chantier</p>
            </div>
            <div className="border-b pb-4">
              <p className="text-sm text-muted-foreground">Détail des travaux</p>
              <table className="w-full text-sm mt-2">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-2">Description</th>
                    <th className="text-right p-2">Qté</th>
                    <th className="text-right p-2">Prix HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Main d&apos;œuvre</td>
                    <td className="text-right p-2">4h</td>
                    <td className="text-right p-2">180€</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Fournitures</td>
                    <td className="text-right p-2">1</td>
                    <td className="text-right p-2">150€</td>
                  </tr>
                  <tr>
                    <td className="p-2">Déplacement</td>
                    <td className="text-right p-2">1</td>
                    <td className="text-right p-2">35€</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-between">
              <span>Total TTC</span>
              <span className="font-bold">401,50€</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Acompte demandé (30%) : <strong>120,45€</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages ChantiPay */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Pourquoi utiliser ChantiPay plutôt qu&apos;un modèle Word ?
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Calculs automatiques</strong> : totaux HT, TVA, TTC et
                acompte calculés en temps réel.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>
                  <Link
                    href="/signature-devis-electronique"
                    className="text-primary hover:underline"
                  >
                    Signature intégrée
                  </Link>
                </strong>{' '}
                : le client signe au doigt, c&apos;est enregistré dans le PDF.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>PDF professionnel</strong> : design propre avec votre
                logo et toutes les mentions légales.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>
                  <Link
                    href="/acompte-chantier"
                    className="text-primary hover:underline"
                  >
                    Suivi d&apos;acompte
                  </Link>
                </strong>{' '}
                : gardez une trace des paiements reçus.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Mobile-first</strong> : créez vos devis{' '}
                <Link
                  href="/devis-sur-mobile"
                  className="text-primary hover:underline"
                >
                  sur smartphone
                </Link>
                , même sur le chantier.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* IA */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-4">
            <Sparkles className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Génération IA des lignes
              </h2>
              <p className="text-muted-foreground mb-4">
                Décrivez simplement les travaux à réaliser, et l&apos;IA génère
                automatiquement les lignes du devis : main d&apos;œuvre,
                fournitures, déplacement. Vous ajustez ensuite les prix selon
                vos tarifs.
              </p>
              <p className="text-muted-foreground">
                Idéal pour les{' '}
                <Link
                  href="/devis-plombier"
                  className="text-primary hover:underline"
                >
                  plombiers
                </Link>
                ,{' '}
                <Link
                  href="/devis-electricien"
                  className="text-primary hover:underline"
                >
                  électriciens
                </Link>{' '}
                et tous les artisans du bâtiment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lien tarifs */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Combien ça coûte ?</h2>
          <p className="text-muted-foreground">
            ChantiPay démarre à 19€/mois pour les artisans solo, avec devis
            illimités, PDF pro et signature électronique.{' '}
            <Link href="/tarifs" className="text-primary hover:underline">
              Voir les tarifs →
            </Link>
          </p>
        </div>
      </section>
    </SeoPageLayout>
  )
}
