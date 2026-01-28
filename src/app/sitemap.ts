import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Page d'accueil - priorité maximale
  const homepage = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
  ]

  // Pages principales marketing
  const publicRoutes = [
    {
      url: `${BASE_URL}/tarifs`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/demo`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // Pages SEO par fonctionnalité (haute priorité)
  const featurePages = [
    {
      url: `${BASE_URL}/logiciel-devis-artisan`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/logiciel-facture-artisan`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/signature-devis-electronique`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/devis-sur-mobile`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/acompte-chantier`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/facture-electronique-artisan`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/modele-devis-artisan`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  // Pages SEO par métier (bonne priorité pour le référencement local)
  const tradePages = [
    {
      url: `${BASE_URL}/devis-plombier`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/devis-electricien`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/devis-peintre`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/devis-menuisier`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/devis-macon`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE_URL}/devis-carreleur`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/devis-couvreur`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/devis-chauffagiste`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Pages légales (basse priorité)
  const legalPages = [
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cgu`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/politique-confidentialite`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  return [
    ...homepage,
    ...publicRoutes,
    ...featurePages,
    ...tradePages,
    ...legalPages,
  ]
}
