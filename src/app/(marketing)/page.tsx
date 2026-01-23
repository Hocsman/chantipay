'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeatureSection } from '@/components/landing/FeatureSection';
import { FacturXSection } from '@/components/landing/FacturXSection';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Building2 } from 'lucide-react';

// JSON-LD Structured Data
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com';

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ChantiPay',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'Application mobile-first pour artisans : créez des devis professionnels, faites signer au doigt, générez des PDF et encaissez l\'acompte instantanément.',
  url: BASE_URL,
  offers: [
    {
      '@type': 'Offer',
      name: 'Artisan Solo',
      price: '19',
      priceCurrency: 'EUR',
      priceValidUntil: '2025-12-31',
      description: 'Pour les artisans indépendants - Devis illimités, signature électronique, paiement en ligne',
    },
    {
      '@type': 'Offer',
      name: 'Petite équipe',
      price: '39',
      priceCurrency: 'EUR',
      priceValidUntil: '2025-12-31',
      description: 'Jusqu\'à 5 utilisateurs - Toutes les fonctionnalités + tableau de bord équipe',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Devis sur mobile',
    'Signature électronique au doigt',
    'Génération PDF professionnelle',
    'Paiement d\'acompte en ligne',
    'Génération Factur-X',
  ],
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ChantiPay',
  url: BASE_URL,
  logo: `${BASE_URL}/icons/icon-512x512.svg`,
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@chantipay.com',
    contactType: 'customer service',
    availableLanguage: 'French',
  },
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />

      {/* Header Transparent */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
              <Image
                src="/favicon.svg"
                alt="ChantiPay"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-orange-500 transition-colors duration-300">ChantiPay</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* ThemeToggle hidden on landing page for stricter design control or adapted */}
            {/* <ThemeToggle /> */}
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-900/20">Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <HeroSection />
        <FeatureSection />
        <FacturXSection />

        {/* Pricing Section (Adapted Dark) */}
        <section className="bg-white py-24 sm:py-32 border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tarifs simples et transparents
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Pas de frais cachés. Annulez à tout moment.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
              {/* Plan Solo */}
              <Card className="relative overflow-hidden border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <CardHeader>
                  <CardTitle className="text-2xl">Artisan Solo</CardTitle>
                  <CardDescription>Pour les indépendants</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">19€</span>
                    <span className="text-xl font-semibold text-gray-500">/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Devis & Factures illimités',
                      'Signature électronique',
                      'Paiement en ligne instantané',
                      'Factur-X 100% conforme',
                      '50 générations IA/mois',
                      'Export PDF & Comptable'
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block">
                    <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-lg">
                      Commencer l'essai gratuit
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-gray-500 mt-4">14 jours offerts, sans engagement</p>
                </CardContent>
              </Card>

              {/* Plan Team */}
              <Card className="relative overflow-hidden border-purple-200 bg-slate-50/50">
                <div className="absolute top-0 right-0 p-4">
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 ring-1 ring-inset ring-purple-600/20">
                    <Sparkles className="h-3 w-3 mr-1" /> Bêta
                  </span>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">Petite équipe</CardTitle>
                  <CardDescription>Jusqu'à 5 utilisateurs</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight text-gray-900">39€</span>
                    <span className="text-xl font-semibold text-gray-500">/mois</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {[
                      'Tout du plan Solo',
                      '5 comptes utilisateurs',
                      'Tableau de bord équipe',
                      'Partage de documents',
                      '200 générations IA/mois',
                      'Support prioritaire'
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full border-purple-200 bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 h-12 text-lg border" asChild>
                    <a href="mailto:contact@chantipay.com?subject=Accès%20bêta%20Petite%20équipe">
                      Rejoindre la bêta
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-black py-24 sm:py-32 relative overflow-hidden">
          {/* Decor */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative mx-auto max-w-3xl px-4 text-center z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Prêt à changer de dimension ?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Rejoignez les artisans qui ont choisi la modernité. Plus de temps pour vos chantiers, moins de temps dans les papiers.
            </p>
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white border-0 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all duration-300">
                Commencer maintenant
              </Button>
            </Link>
            <p className="mt-6 text-sm text-gray-500">
              Aucune carte bancaire requise. 14 jours d'essai gratuit.
            </p>
          </div>
        </section>
      </main>

      {/* Footer Dark */}
      <footer className="bg-black border-t border-white/10 py-12 text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 group">
                <div className="relative h-8 w-8 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
                  <Image
                    src="/favicon.svg"
                    alt="ChantiPay"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors duration-300">ChantiPay</span>
              </div>
              <p className="text-sm leading-relaxed">
                La solution de gestion complète pour les artisans du bâtiment. Devis, factures, paiements : tout est plus simple.
              </p>
            </div>

            {/* Links columns could be added here if needed */}
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2025 ChantiPay. Tous droits réservés.</p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
