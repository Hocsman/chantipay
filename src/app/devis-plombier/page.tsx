import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Droplets, CheckCircle } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Devis plombier : exemple + lignes typiques (PDF) | ChantiPay',
  description:
    'Exemples de lignes pour un devis plomberie (déplacement, main d\'œuvre, fournitures) + génération PDF pro et signature sur chantier. Démo ChantiPay.',
  alternates: {
    canonical: `${BASE_URL}/devis-plombier`,
  },
}

const faqs = [
  {
    question: 'Quelles lignes mettre dans un devis de plomberie ?',
    answer:
      'Un devis plombier inclut généralement : le déplacement, la main d\'œuvre (tarif horaire), les fournitures (robinetterie, tuyaux, joints...), et éventuellement la dépose de l\'ancien équipement.',
  },
  {
    question: 'Comment calculer le prix d\'une intervention plomberie ?',
    answer:
      'Additionnez le coût du déplacement, le temps de main d\'œuvre estimé (nombre d\'heures x tarif horaire), et le prix des fournitures. N\'oubliez pas la TVA (10% rénovation, 20% neuf).',
  },
  {
    question: 'Faut-il inclure la TVA dans le devis ?',
    answer:
      'Oui, le devis doit afficher les montants HT et TTC. ChantiPay calcule automatiquement la TVA selon le taux que vous indiquez (5.5%, 10% ou 20%).',
  },
  {
    question: 'L\'IA peut-elle générer un devis de plomberie ?',
    answer:
      'Oui, décrivez les travaux (ex: remplacement chauffe-eau 200L) et l\'IA génère les lignes typiques : dépose, fourniture, pose, mise en service. Vous ajustez ensuite les prix.',
  },
  {
    question: 'Comment faire signer le devis sur le chantier ?',
    answer:
      'Avec ChantiPay, le client signe directement sur votre smartphone avec son doigt. La signature est intégrée au PDF pour garder une trace de l\'accord.',
  },
]

const exempleLignes = [
  { description: 'Déplacement', qte: '1', unite: 'forfait', prixHT: '35€' },
  { description: 'Dépose ancien chauffe-eau', qte: '1', unite: 'u', prixHT: '60€' },
  { description: 'Fourniture chauffe-eau électrique 200L', qte: '1', unite: 'u', prixHT: '450€' },
  { description: 'Pose et raccordement', qte: '2', unite: 'h', prixHT: '90€' },
  { description: 'Groupe de sécurité', qte: '1', unite: 'u', prixHT: '35€' },
  { description: 'Mise en service et tests', qte: '1', unite: 'forfait', prixHT: '40€' },
]

export default function DevisPlombierPage() {
  return (
    <SeoPageLayout currentPath="/devis-plombier" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Droplets className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Devis plombier : exemple et lignes typiques
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Découvrez comment structurer un devis de plomberie professionnel :
            lignes, prix, TVA. Générez votre PDF et faites signer sur chantier.
          </p>
        </div>
      </section>

      {/* Exemple de devis */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Exemple : remplacement chauffe-eau
          </h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Description</th>
                  <th className="text-center p-3 w-16">Qté</th>
                  <th className="text-center p-3 w-16">Unité</th>
                  <th className="text-right p-3 w-20">Prix HT</th>
                </tr>
              </thead>
              <tbody>
                {exempleLignes.map((ligne, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{ligne.description}</td>
                    <td className="text-center p-3">{ligne.qte}</td>
                    <td className="text-center p-3 text-muted-foreground">
                      {ligne.unite}
                    </td>
                    <td className="text-right p-3 font-medium">{ligne.prixHT}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="border-t">
                  <td colSpan={3} className="p-3 font-semibold">
                    Total HT
                  </td>
                  <td className="text-right p-3 font-bold">710€</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-3 text-muted-foreground">
                    TVA (10%)
                  </td>
                  <td className="text-right p-3">71€</td>
                </tr>
                <tr className="border-t">
                  <td colSpan={3} className="p-3 font-bold text-lg">
                    Total TTC
                  </td>
                  <td className="text-right p-3 font-bold text-lg">781€</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            💡 Avec ChantiPay, décrivez les travaux et l&apos;IA génère ces lignes
            automatiquement. Vous ajustez ensuite les prix.
          </p>
        </div>
      </section>

      {/* Types d'interventions */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Interventions plomberie courantes
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dépannage urgent</strong> : fuite, WC bouché,
                robinet cassé
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Remplacement équipement</strong> : chauffe-eau, WC,
                robinetterie
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Installation neuve</strong> : salle de bain, cuisine,
                chauffage
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Entretien</strong> : détartrage, vérification chaudière
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Avantages ChantiPay */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Pourquoi ChantiPay pour les plombiers ?
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>
                  <Link
                    href="/devis-sur-mobile"
                    className="text-primary hover:underline"
                  >
                    Devis sur mobile
                  </Link>
                </strong>{' '}
                : créez le devis directement chez le client.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>IA intégrée</strong> : décrivez les travaux, les lignes
                se génèrent.
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
                    Signature au doigt
                  </Link>
                </strong>{' '}
                : le client valide sur place, vous repartez avec un accord.
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
                    Acompte sécurisé
                  </Link>
                </strong>{' '}
                : demandez 30% avant de commander le matériel.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Autres métiers */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Autres métiers</h2>
          <p className="text-muted-foreground mb-4">
            ChantiPay s&apos;adapte à tous les artisans du bâtiment :
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/devis-electricien"
              className="px-4 py-2 bg-white border rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Électricien
            </Link>
            <Link
              href="/logiciel-devis-artisan"
              className="px-4 py-2 bg-white border rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Tous métiers
            </Link>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
