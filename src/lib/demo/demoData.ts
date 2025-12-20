// Demo data for the interactive demo (no auth, no DB)
// All data is mock and used only for demonstration purposes

export const demoProfile = {
  id: 'demo-profile-id',
  email: 'demo@chantipay.com',
  company_name: 'Martin Électricité',
  first_name: 'Jean',
  last_name: 'Martin',
  phone: '06 12 34 56 78',
  address: '15 rue des Artisans',
  city: 'Lyon',
  postal_code: '69003',
  siret: '12345678901234',
  logo_url: null,
  default_payment_terms: 'Paiement à réception de facture. Acompte de 30% à la signature.',
  default_vat_rate: 10,
}

export const demoClient = {
  id: 'demo-client-id',
  name: 'Dupont Sophie',
  email: 'sophie.dupont@email.fr',
  phone: '06 98 76 54 32',
  address: '42 avenue Victor Hugo',
  city: 'Villeurbanne',
  postal_code: '69100',
  notes: 'Cliente recommandée par M. Bernard',
}

export const demoQuote = {
  id: 'demo-quote-id',
  quote_number: 'DEV-2025-DEMO',
  status: 'sent' as const,
  title: 'Rénovation électrique cuisine',
  description: 'Mise aux normes du tableau électrique et installation de nouveaux points lumineux dans la cuisine.',
  total_ht: 1850.00,
  total_tva: 185.00,
  total_ttc: 2035.00,
  vat_rate: 10,
  deposit_percentage: 30,
  deposit_amount: 610.50,
  deposit_paid_at: null as string | null,
  deposit_method: null as string | null,
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  signed_at: null as string | null,
  signature_image_url: null as string | null,
  payment_terms: 'Paiement à réception de facture. Acompte de 30% à la signature.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const demoItems = [
  {
    id: 'demo-item-1',
    quote_id: 'demo-quote-id',
    description: 'Dépose ancien tableau électrique',
    quantity: 1,
    unit: 'forfait',
    unit_price_ht: 150.00,
    vat_rate: 10,
    total_ht: 150.00,
    position: 1,
  },
  {
    id: 'demo-item-2',
    quote_id: 'demo-quote-id',
    description: 'Fourniture tableau électrique 2 rangées',
    quantity: 1,
    unit: 'pièce',
    unit_price_ht: 280.00,
    vat_rate: 10,
    total_ht: 280.00,
    position: 2,
  },
  {
    id: 'demo-item-3',
    quote_id: 'demo-quote-id',
    description: 'Disjoncteurs et protections',
    quantity: 8,
    unit: 'pièce',
    unit_price_ht: 45.00,
    vat_rate: 10,
    total_ht: 360.00,
    position: 3,
  },
  {
    id: 'demo-item-4',
    quote_id: 'demo-quote-id',
    description: 'Câblage et gaines électriques',
    quantity: 25,
    unit: 'm',
    unit_price_ht: 12.00,
    vat_rate: 10,
    total_ht: 300.00,
    position: 4,
  },
  {
    id: 'demo-item-5',
    quote_id: 'demo-quote-id',
    description: 'Main d\'œuvre installation et mise en service',
    quantity: 1,
    unit: 'forfait',
    unit_price_ht: 760.00,
    vat_rate: 10,
    total_ht: 760.00,
    position: 5,
  },
]

// Helper to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

// Helper to format date
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
