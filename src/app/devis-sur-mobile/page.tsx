import { Metadata } from 'next'
import Link from 'next/link'
import { SeoPageLayout } from '@/components/marketing'
import { Smartphone, Zap, Send, CheckCircle } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export const metadata: Metadata = {
  title: 'Devis sur mobile : créer un devis sur chantier | ChantiPay',
  description:
    'Faites un devis directement sur smartphone : lignes, totaux, PDF et envoi au client. Signature au doigt incluse. Essayez la démo ChantiPay.',
  alternates: {
    canonical: `${BASE_URL}/devis-sur-mobile`,
  },
}

const faqs = [
  {
    question: 'Puis-je créer un devis rapidement sur le chantier ?',
    answer:
      'Oui, ChantiPay est conçu pour ça. En quelques taps, vous ajoutez vos lignes (main d\'œuvre, matériel, déplacement) et le total se calcule automatiquement.',
  },
  {
    question: 'Comment envoyer le devis au client ?',
    answer:
      'Une fois le devis créé, vous pouvez générer un PDF et l\'envoyer par email ou SMS directement depuis l\'application.',
  },
  {
    question: 'Le devis est-il valable juridiquement ?',
    answer:
      'Oui, le devis contient toutes les mentions légales obligatoires. La signature électronique au doigt constitue une trace de l\'acceptation par le client.',
  },
  {
    question: 'Faut-il une connexion internet pour créer un devis ?',
    answer:
      'Une connexion est nécessaire pour sauvegarder et synchroniser vos données. Vous pouvez consulter vos devis existants hors ligne.',
  },
  {
    question: 'ChantiPay fonctionne-t-il sur tablette ?',
    answer:
      'Oui, ChantiPay fonctionne sur smartphone et tablette. L\'interface s\'adapte automatiquement à la taille de l\'écran.',
  },
]

export default function DevisSurMobilePage() {
  return (
    <SeoPageLayout currentPath="/devis-sur-mobile" faqs={faqs}>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Créez un devis sur mobile, directement sur chantier
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plus besoin d&apos;attendre le soir pour rédiger vos devis. Avec
            ChantiPay, faites tout depuis votre smartphone : lignes, totaux,
            PDF, envoi.
          </p>
        </div>
      </section>

      {/* Problème */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Le problème des devis papier
          </h2>
          <p className="text-muted-foreground mb-4">
            Vous rentrez fatigué du chantier, et il faut encore rédiger les
            devis de la journée. Vous notez les infos sur un bout de papier, que
            vous perdez parfois. Le client attend, vous aussi.
          </p>
          <p className="text-muted-foreground">
            Avec un{' '}
            <Link
              href="/logiciel-devis-artisan"
              className="text-primary hover:underline"
            >
              logiciel de devis mobile
            </Link>
            , vous gagnez du temps et vous faites bonne impression auprès du
            client.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">
            ChantiPay : le devis sur mobile en 3 étapes
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg border text-center">
              <Smartphone className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">1. Créez</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez les lignes du devis en quelques secondes. L&apos;IA peut
                vous aider à générer les lignes automatiquement.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg border text-center">
              <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">2. Signez</h3>
              <p className="text-sm text-muted-foreground">
                Le client{' '}
                <Link
                  href="/signature-devis-electronique"
                  className="text-primary hover:underline"
                >
                  signe au doigt
                </Link>{' '}
                sur votre téléphone. C&apos;est rapide et professionnel.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg border text-center">
              <Send className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">3. Envoyez</h3>
              <p className="text-sm text-muted-foreground">
                Générez le PDF et envoyez-le par email ou SMS. Le client
                reçoit un document pro instantanément.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-12 bg-slate-50 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">
            Les avantages du devis mobile
          </h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Gain de temps</strong> : plus de devis à refaire le soir
                à la maison.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Image professionnelle</strong> : impressionnez vos
                clients avec un PDF propre.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Signature immédiate</strong> : pas besoin d&apos;attendre un
                retour par email.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Suivi d&apos;acompte</strong> :{' '}
                <Link
                  href="/acompte-chantier"
                  className="text-primary hover:underline"
                >
                  demandez et suivez l&apos;acompte
                </Link>{' '}
                facilement.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Métiers */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Pour tous les métiers</h2>
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
              href="/devis-electricien"
              className="px-4 py-2 bg-white border rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              Électricien
            </Link>
            <span className="px-4 py-2 bg-white border rounded-lg">
              Peintre
            </span>
            <span className="px-4 py-2 bg-white border rounded-lg">
              Menuisier
            </span>
            <span className="px-4 py-2 bg-white border rounded-lg">Maçon</span>
          </div>
        </div>
      </section>
    </SeoPageLayout>
  )
}
