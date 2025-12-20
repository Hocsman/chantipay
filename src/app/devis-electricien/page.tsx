import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Zap, CheckCircle } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Devis électricien : exemple + lignes typiques (PDF) | ChantiPay',
  description:
    'Exemples de lignes pour un devis électricité (diagnostic, matériel, pose) + PDF pro et signature au doigt. Créez votre devis avec ChantiPay.',
  alternates: {
    canonical: `${BASE_URL}/devis-electricien`,
  },
}

const faqs = [
  {
    question: 'Comment structurer un devis d\'électricité ?',
    answer:
      'Un devis électricien comprend généralement : le diagnostic/repérage, la fourniture du matériel (câbles, disjoncteurs, prises...), la main d\'œuvre (pose, raccordement), et les tests de conformité.',
  },
  {
    question: 'Quel taux de TVA appliquer pour des travaux électriques ?',
    answer:
      'Pour la rénovation dans un logement de plus de 2 ans, le taux réduit de 10% s\'applique. Pour du neuf ou du matériel seul, c\'est 20%. ChantiPay gère les deux taux automatiquement.',
  },
  {
    question: 'Faut-il détailler chaque prise et interrupteur ?',
    answer:
      'C\'est recommandé pour plus de clarté. Vous pouvez regrouper par type (ex: "10 prises 16A" ou "5 interrupteurs va-et-vient") pour simplifier le devis.',
  },
  {
    question: 'Comment faire signer le devis électricité rapidement ?',
    answer:
      'Avec ChantiPay, montrez le devis au client sur votre téléphone. Il signe avec son doigt, et vous générez un PDF signé instantanément.',
  },
  {
    question: 'L\'IA peut-elle aider à créer un devis électricité ?',
    answer:
      'Oui, décrivez les travaux (ex: mise aux normes tableau électrique) et l\'IA génère les lignes typiques. Vous ajustez ensuite les quantités et les prix.',
  },
]

const exempleLignes = [
  { description: 'Diagnostic installation existante', qte: '1', unite: 'forfait', prixHT: '80€' },
  { description: 'Dépose ancien tableau', qte: '1', unite: 'u', prixHT: '60€' },
  { description: 'Tableau électrique 3 rangées', qte: '1', unite: 'u', prixHT: '180€' },
  { description: 'Disjoncteur différentiel 30mA', qte: '2', unite: 'u', prixHT: '90€' },
  { description: 'Disjoncteurs divisionnaires', qte: '12', unite: 'u', prixHT: '120€' },
  { description: 'Câblage et raccordement', qte: '4', unite: 'h', prixHT: '200€' },
  { description: 'Tests et mise en service', qte: '1', unite: 'forfait', prixHT: '50€' },
]

export default function DevisElectricienPage() {
  return (
    <SeoPageLayout currentPath="/devis-electricien" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 p-4 rounded-full">
              <Zap className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Devis électricien : exemple et lignes typiques
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Structurez vos devis d&apos;électricité comme un pro : diagnostic,
            matériel, pose, tests. Générez un PDF et faites signer sur place.
          </p>
        </div>
      </section>

      {/* Exemple de devis */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Exemple : mise aux normes tableau électrique
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
                  <td className="text-right p-3 font-bold">780€</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-3 text-muted-foreground">
                    TVA (10%)
                  </td>
                  <td className="text-right p-3">78€</td>
                </tr>
                <tr className="border-t">
                  <td colSpan={3} className="p-3 font-bold text-lg">
                    Total TTC
                  </td>
                  <td className="text-right p-3 font-bold text-lg">858€</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            💡 Avec ChantiPay, décrivez les travaux et l&apos;IA génère ces lignes
            automatiquement. Vous ajustez ensuite les prix selon vos tarifs.
          </p>
        </div>
      </section>

      {/* Types d'interventions */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Interventions électricité courantes
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Mise aux normes</strong> : tableau, différentiels, terre
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Installation neuve</strong> : prises, éclairages,
                domotique
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Rénovation</strong> : remplacement câblage, ajout
                circuits
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Dépannage</strong> : panne, disjoncteur qui saute, prise
                défectueuse
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Avantages ChantiPay */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Pourquoi ChantiPay pour les électriciens ?
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
                : faites le devis pendant la visite technique.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>IA intégrée</strong> : décrivez "mise aux normes tableau
                maison 100m²" et les lignes se génèrent.
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
                : le client valide immédiatement, pas de relance.
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
                : demandez 30% avant de commander le matériel électrique.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Combien ça coûte ?</h2>
          <p className="text-muted-foreground mb-4">
            ChantiPay démarre à 19€/mois pour les électriciens indépendants.
            Devis illimités, PDF pro, signature et suivi d&apos;acompte inclus.
          </p>
          <Link href="/tarifs" className="text-primary hover:underline font-medium">
            Voir les tarifs complets →
          </Link>
        </div>
      </section>

      {/* Autres métiers */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-4">Autres métiers</h2>
          <p className="text-muted-foreground mb-4">
            ChantiPay s&apos;adapte à tous les artisans du bâtiment :
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/devis-plombier"
              className="px-4 py-2 bg-white border rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Plombier
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
