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

// JSON-LD Structured Data for SEO
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com';

// Schema.org SoftwareApplication
const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ChantiPay',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Invoice Software',
  operatingSystem: 'Web, iOS, Android',
  description: 'Logiciel de devis et factures pour artisans du bâtiment. Créez vos devis professionnels sur mobile, faites signer électroniquement et encaissez l\'acompte instantanément. Idéal pour plombiers, électriciens, peintres, menuisiers.',
  url: BASE_URL,
  downloadUrl: BASE_URL,
  screenshot: `${BASE_URL}/og-image.png`,
  softwareVersion: '2.0',
  datePublished: '2024-01-01',
  inLanguage: 'fr-FR',
  offers: [
    {
      '@type': 'Offer',
      name: 'Artisan Solo',
      price: '19',
      priceCurrency: 'EUR',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      description: 'Pour les artisans indépendants - Devis et factures illimités, signature électronique, paiement en ligne, Factur-X',
      url: `${BASE_URL}/register`,
    },
    {
      '@type': 'Offer',
      name: 'Petite équipe',
      price: '39',
      priceCurrency: 'EUR',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
      description: 'Jusqu\'à 5 utilisateurs - Toutes les fonctionnalités + tableau de bord équipe + support prioritaire',
      url: `${BASE_URL}/register`,
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Création de devis sur mobile en 2 minutes',
    'Signature électronique légale au doigt',
    'Génération PDF professionnelle automatique',
    'Paiement d\'acompte en ligne par carte bancaire',
    'Factures conformes Factur-X',
    'Relances automatiques',
    'Export comptable',
    'IA pour suggestions de devis',
  ],
  author: {
    '@type': 'Organization',
    name: 'ChantiPay',
  },
};

// Schema.org Organization
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ChantiPay',
  legalName: 'ChantiPay SAS',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/icons/icon-512x512.svg`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/og-image.png`,
  description: 'ChantiPay est le logiciel de devis et factures n°1 pour les artisans du bâtiment en France.',
  foundingDate: '2024',
  founders: [
    {
      '@type': 'Person',
      name: 'ChantiPay Team',
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'contact@chantipay.com',
      contactType: 'customer service',
      availableLanguage: ['French'],
      areaServed: 'FR',
    },
    {
      '@type': 'ContactPoint',
      email: 'support@chantipay.com',
      contactType: 'technical support',
      availableLanguage: ['French'],
    },
  ],
  sameAs: [
    // Ajouter les liens réseaux sociaux quand disponibles
    // 'https://www.linkedin.com/company/chantipay',
    // 'https://twitter.com/chantipay',
  ],
};

// Schema.org WebSite avec SearchAction pour Google Sitelinks
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ChantiPay',
  alternateName: 'ChantiPay - Devis artisan',
  url: BASE_URL,
  description: 'Logiciel de devis et factures pour artisans du bâtiment',
  inLanguage: 'fr-FR',
  publisher: {
    '@type': 'Organization',
    name: 'ChantiPay',
  },
};

// Schema.org FAQPage pour les questions fréquentes
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment créer un devis avec ChantiPay ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Avec ChantiPay, créez un devis professionnel en moins de 2 minutes directement depuis votre smartphone. Ajoutez vos prestations, le client peut signer au doigt sur l\'écran et vous pouvez encaisser l\'acompte immédiatement.',
      },
    },
    {
      '@type': 'Question',
      name: 'La signature électronique est-elle légale ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, la signature électronique de ChantiPay est conforme au règlement européen eIDAS. Elle a la même valeur juridique qu\'une signature manuscrite et est horodatée pour garantir l\'intégrité du document.',
      },
    },
    {
      '@type': 'Question',
      name: 'Combien coûte ChantiPay ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ChantiPay propose un plan Artisan Solo à 19€/mois avec devis et factures illimités, signature électronique et paiement en ligne. Un essai gratuit de 7 jours est disponible sans engagement.',
      },
    },
    {
      '@type': 'Question',
      name: 'ChantiPay est-il compatible avec ma comptabilité ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, ChantiPay génère des factures au format Factur-X, le standard français de facturation électronique. Vous pouvez exporter vos données au format Excel pour votre comptable.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quels métiers peuvent utiliser ChantiPay ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ChantiPay est conçu pour tous les artisans du bâtiment : plombiers, électriciens, peintres, menuisiers, maçons, carreleurs, couvreurs, chauffagistes, et plus encore.',
      },
    },
  ],
};

// Schema.org BreadcrumbList pour la navigation
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: BASE_URL,
    },
  ],
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* JSON-LD Structured Data for SEO */}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
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
                  <p className="text-xs text-center text-gray-500 mt-4">7 jours d'essai gratuit, sans engagement</p>
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
              paiement par carte bancaire. 7 jours d'essai gratuit.
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
