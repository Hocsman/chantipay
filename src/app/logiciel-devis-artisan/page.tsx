import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Smartphone, FileText, Pen, CreditCard, CheckCircle } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Logiciel devis artisan sur mobile (PDF + signature) | ChantiPay',
  description:
    'Créez des devis en 2 min sur mobile, faites signer au doigt et générez un PDF pro. Suivi simple de l\'acompte. Testez la démo ChantiPay.',
  alternates: {
    canonical: `${BASE_URL}/logiciel-devis-artisan`,
  },
}

const faqs = [
  {
    question: 'ChantiPay fonctionne-t-il sur tous les téléphones ?',
    answer:
      'Oui, ChantiPay est une application web qui fonctionne sur tous les smartphones (iPhone, Android) via le navigateur. Aucune installation requise.',
  },
  {
    question: 'Puis-je créer un devis sans connexion internet ?',
    answer:
      'La création de devis nécessite une connexion pour sauvegarder les données. Cependant, vous pouvez consulter vos devis existants hors ligne grâce au mode PWA.',
  },
  {
    question: 'Le PDF généré est-il professionnel ?',
    answer:
      'Oui, le PDF inclut votre logo, les mentions légales obligatoires, le détail des lignes et la signature du client si le devis est signé.',
  },
  {
    question: 'Comment fonctionne le suivi d\'acompte ?',
    answer:
      'Une fois le devis signé, vous pouvez marquer l\'acompte comme encaissé (virement, espèces, chèque) et suivre le statut directement dans l\'app.',
  },
  {
    question: 'Y a-t-il un engagement ou une période d\'essai ?',
    answer:
      'Vous bénéficiez de 14 jours d\'essai gratuit sans carte bancaire. Ensuite, vous pouvez continuer avec l\'offre Artisan Solo à 19€/mois, sans engagement.',
  },
]

export default function LogicielDevisArtisanPage() {
  return (
    <SeoPageLayout currentPath="/logiciel-devis-artisan" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Logiciel devis artisan sur mobile
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Créez des devis professionnels en 2 minutes, faites signer au doigt
            et générez un PDF prêt à envoyer. Tout ça depuis votre téléphone.
          </p>
        </div>
      </section>

      {/* Problème */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Marre des devis sur papier ?
          </h2>
          <p className="text-muted-foreground mb-4">
            En tant qu&apos;artisan, vous perdez un temps précieux à rédiger des
            devis le soir, à scanner des documents et à courir après les
            signatures. Sans compter les acomptes jamais versés...
          </p>
          <p className="text-muted-foreground">
            Avec un <strong>logiciel de devis adapté aux artisans</strong>, vous
            pouvez tout faire sur le terrain : créer, signer, envoyer. Plus
            besoin d&apos;attendre d&apos;être au bureau.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            ChantiPay : le logiciel pensé pour le terrain
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <Smartphone className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">100% mobile</h3>
                <p className="text-sm text-muted-foreground">
                  Créez vos devis directement sur smartphone, même sur le
                  chantier.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <Pen className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">
                  <Link
                    href="/signature-devis-electronique"
                    className="hover:text-primary"
                  >
                    Signature au doigt
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Le client signe sur votre écran, la trace est conservée dans
                  le PDF.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <FileText className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">PDF professionnel</h3>
                <p className="text-sm text-muted-foreground">
                  Générez un PDF avec votre logo et les mentions légales en un
                  clic.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-white rounded-lg border">
              <CreditCard className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">
                  <Link href="/acompte-chantier" className="hover:text-primary">
                    Suivi d&apos;acompte
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Demandez un acompte et suivez son encaissement facilement.
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
              <h3 className="font-semibold mb-2">Créez votre devis</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos lignes (main d&apos;œuvre, fournitures, déplacement)
                en quelques taps.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Faites signer</h3>
              <p className="text-sm text-muted-foreground">
                Le client signe directement sur votre téléphone avec son doigt.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Encaissez l&apos;acompte</h3>
              <p className="text-sm text-muted-foreground">
                Marquez l&apos;acompte comme reçu et gardez une trace claire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pourquoi ChantiPay */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Pourquoi choisir ChantiPay ?
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Simple</strong> : interface pensée pour les artisans,
                pas besoin d&apos;être un expert en informatique.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Rapide</strong> : créez un devis complet en moins de 2
                minutes.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tout-en-un</strong> : devis, signature, PDF, acompte
                dans une seule app.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Prix transparent</strong> : 19€/mois sans engagement.{' '}
                <Link href="/tarifs" className="text-primary hover:underline">
                  Voir les tarifs
                </Link>
              </span>
            </li>
          </ul>
        </div>
      </section>
    </SeoPageLayout>
  )
}
