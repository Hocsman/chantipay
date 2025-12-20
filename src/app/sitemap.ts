import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Public marketing pages
  const publicRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/demo`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
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

  // SEO landing pages (to be added later)
  // const seoLandingPages = [
  //   { url: `${BASE_URL}/devis-plombier`, ... },
  //   { url: `${BASE_URL}/devis-electricien`, ... },
  //   { url: `${BASE_URL}/application-devis-artisan`, ... },
  // ]

  return publicRoutes
}
