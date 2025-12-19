/**
 * ===========================================
 * Legal Entity Constants
 * ===========================================
 * Centralized placeholders for legal pages.
 * Replace these values with your actual company information.
 */

export const LEGAL_ENTITY = {
  // === Company Information ===
  companyName: 'Chantipay',
  legalForm: 'Micro-entreprise',
  address: 'Paris',
  postalCode: '75000',
  city: 'Paris',
  country: 'France',
  email: 'contact@chantipay.com',
  phone: '', // Optional
  siret: '99456306200011',
  tvaNumber: 'Non assujetti (micro-entreprise)', // If applicable
  
  // === Publication Director ===
  publisherName: 'Hocine AZZOUG',
  
  // === Hosting Provider ===
  hostingProvider: {
    name: 'Vercel Inc.',
    address: '340 S Lemon Ave #4133',
    city: 'Walnut, CA 91789',
    country: 'États-Unis',
    website: 'https://vercel.com',
  },
  
  // === Service Information ===
  serviceName: 'ChantiPay',
  serviceUrl: 'https://www.chantipay.com',
  
  // === Data Processors ===
  dataProcessors: [
    {
      name: 'Supabase Inc.',
      purpose: 'Base de données, authentification, stockage',
      location: 'États-Unis / Union Européenne',
      website: 'https://supabase.com',
    },
    {
      name: 'Stripe Inc.',
      purpose: 'Traitement des paiements et abonnements',
      location: 'États-Unis / Union Européenne',
      website: 'https://stripe.com',
    },
    {
      name: 'Vercel Inc.',
      purpose: 'Hébergement et CDN',
      location: 'États-Unis',
      website: 'https://vercel.com',
    },
  ],
  
  // === Data Retention (indicative) ===
  dataRetention: {
    accountData: '3 ans après la dernière connexion',
    invoices: '10 ans (obligation légale)',
    logs: '12 mois',
  },
  
  // === Regulatory ===
  supervisoryAuthority: {
    name: 'CNIL (Commission Nationale de l\'Informatique et des Libertés)',
    address: '3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07',
    website: 'https://www.cnil.fr',
  },
  
  // === Last Update Date ===
  lastUpdate: {
    mentions: '15 janvier 2025',
    cgu: '15 janvier 2025',
    privacy: '15 janvier 2025',
  },
}

export type LegalEntity = typeof LEGAL_ENTITY
