import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Pen, FileText, Shield, CheckCircle } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Signature devis électronique au doigt (chantier) | ChantiPay',
  description:
    'Faites valider un devis sur place avec une signature au doigt et gardez une trace dans le PDF. Simple, rapide, mobile-first. Voir la démo.',
  alternates: {
    canonical: `${BASE_URL}/signature-devis-electronique`,
  },
}

const faqs = [
  {
    question: 'La signature au doigt a-t-elle une valeur légale ?',
    answer:
      'La signature électronique constitue une preuve d\'acceptation du devis par le client. Elle est intégrée au PDF avec la date et l\'heure, ce qui crée une trace fiable de l\'accord.',
  },
  {
    question: 'Comment le client signe-t-il ?',
    answer:
      'Le client signe directement sur l\'écran de votre smartphone ou tablette avec son doigt. C\'est simple, rapide et ne nécessite aucun équipement particulier.',
  },
  {
    question: 'Puis-je faire signer plusieurs personnes ?',
    answer:
      'Actuellement, ChantiPay permet une signature par devis. Pour les situations nécessitant plusieurs signatures, vous pouvez créer plusieurs devis ou utiliser le PDF signé comme base.',
  },
  {
    question: 'La signature est-elle visible sur le PDF ?',
    answer:
      'Oui, la signature du client apparaît clairement sur le PDF généré, avec la mention "Bon pour accord" et la date de signature.',
  },
  {
    question: 'Que se passe-t-il si le client veut modifier le devis ?',
    answer:
      'Avant signature, vous pouvez modifier le devis autant que nécessaire. Une fois signé, le devis est verrouillé pour garantir l\'intégrité du document.',
  },
]

export default function SignatureDevisElectroniquePage() {
  return (
    <SeoPageLayout currentPath="/signature-devis-electronique" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Signature devis électronique au doigt
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Faites signer vos devis sur place, directement sur votre
            téléphone. Le client valide avec son doigt, vous repartez avec un
            accord ferme.
          </p>
        </div>
      </section>

      {/* Problème */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Fini les devis sans réponse
          </h2>
          <p className="text-muted-foreground mb-4">
            Vous envoyez un devis par email, et puis... silence radio. Le
            client "réfléchit", compare, oublie. Pendant ce temps, vous ne
            savez pas si vous pouvez planifier le chantier.
          </p>
          <p className="text-muted-foreground">
            Avec la signature électronique sur place, vous obtenez un accord
            immédiat. Plus de relances, plus d&apos;attente.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">1. Présentez le devis</h3>
              <p className="text-sm text-muted-foreground">
                Montrez le devis au client sur votre{' '}
                <Link
                  href="/devis-sur-mobile"
                  className="text-primary hover:underline"
                >
                  téléphone
                </Link>
                . Il peut vérifier chaque ligne et le total.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pen className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">2. Signature au doigt</h3>
              <p className="text-sm text-muted-foreground">
                Le client signe directement sur l&apos;écran. Simple, rapide,
                sans paperasse.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">3. PDF signé</h3>
              <p className="text-sm text-muted-foreground">
                La signature est intégrée au PDF. Vous avez une trace de
                l&apos;accord.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Pourquoi la signature électronique ?
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Accord immédiat</strong> : le client s&apos;engage sur
                place, pas de relance à faire.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Trace fiable</strong> : la signature avec date/heure
                est conservée dans le PDF.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Image professionnelle</strong> : impressionnez vos
                clients avec un processus moderne.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Enchaînez sur l&apos;acompte</strong> :{' '}
                <Link
                  href="/acompte-chantier"
                  className="text-primary hover:underline"
                >
                  demandez l&apos;acompte
                </Link>{' '}
                juste après la signature.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Idéal pour les artisans</h2>
          <p className="text-muted-foreground mb-4">
            La signature au doigt est parfaite pour les interventions sur site
            : dépannage, visite de chantier, rendez-vous client. Que vous soyez{' '}
            <Link
              href="/devis-plombier"
              className="text-primary hover:underline"
            >
              plombier
            </Link>{' '}
            ou{' '}
            <Link
              href="/devis-electricien"
              className="text-primary hover:underline"
            >
              électricien
            </Link>
            , vous gagnez du temps et de la sérénité.
          </p>
          <p className="text-muted-foreground">
            Découvrez notre{' '}
            <Link
              href="/logiciel-devis-artisan"
              className="text-primary hover:underline"
            >
              logiciel de devis artisan
            </Link>{' '}
            complet avec signature, PDF et suivi d&apos;acompte.
          </p>
        </div>
      </section>
    </SeoPageLayout>
  )
}
