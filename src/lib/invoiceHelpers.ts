/**
 * ===========================================
 * Invoice Creation Helpers
 * ===========================================
 * Fonctions pour créer des factures à partir de devis
 * avec validation et calcul correct des montants
 */

interface QuoteItem {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface Client {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  city?: string | null
  siret?: string | null
}

interface Quote {
  id: string
  quote_number: string
  items: QuoteItem[]
  // Champs acompte
  deposit_amount?: number | null
  deposit_status?: 'pending' | 'paid' | null
  deposit_paid_at?: string | null
  deposit_method?: string | null
}

interface InvoiceData {
  quote_id: string
  client_id: string
  client_name: string
  client_email: string
  client_phone: string
  client_address: string
  client_siret: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  paid_amount: number // Acompte déjà versé
  payment_status: string
  issue_date: string
  due_date: string
  payment_terms: string
  notes: string
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    total: number
    sort_order: number
    vat_rate: number
  }>
}

/**
 * Vérifie si tous les items ont la même TVA
 * @returns true si homogène, false si mixte
 */
export function hasUniformVAT(items: QuoteItem[]): boolean {
  if (items.length === 0) return true
  const firstRate = items[0].vat_rate
  return items.every(item => item.vat_rate === firstRate)
}

/**
 * Calcule les totaux avec validation côté client
 * Pour double-vérification avant envoi au serveur
 */
export function calculateInvoiceTotals(items: QuoteItem[]) {
  let subtotal = 0
  let taxAmount = 0

  items.forEach(item => {
    const lineTotal = item.quantity * item.unit_price_ht
    const lineTax = lineTotal * (item.vat_rate / 100)
    subtotal += lineTotal
    taxAmount += lineTax
  })

  const total = subtotal + taxAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Obtient le taux de TVA pour la facture
 * - Si uniforme: utilise ce taux
 * - Si mixte: retourne null (nécessite attention manuelle)
 */
export function getInvoiceTaxRate(items: QuoteItem[]): number | null {
  if (items.length === 0) return 20 // Défaut

  const rates = new Set(items.map(item => item.vat_rate))

  if (rates.size === 1) {
    return Array.from(rates)[0]
  }

  // TVA mixte - retourner null pour signal d'attention
  return null
}

/**
 * Formate l'adresse du client
 */
export function formatClientAddress(client: Client): string {
  const parts = [
    client.address_line1,
    client.address_line2,
    client.postal_code,
    client.city,
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Prépare les données pour créer une facture à partir d'un devis
 * Avec toutes les validations et calculs nécessaires
 * Supporte les TVA mixtes (calcul par ligne)
 * Prend en compte l'acompte déjà payé
 */
export function prepareInvoiceDataFromQuote(
  quote: Quote,
  client: Client
): InvoiceData {
  // Calculer les totaux (avec calcul TVA par ligne)
  const calculated = calculateInvoiceTotals(quote.items)
  
  // Pour tax_rate: utiliser le taux uniforme si disponible,
  // sinon calculer le taux effectif moyen pour l'affichage
  let taxRate = getInvoiceTaxRate(quote.items)
  if (taxRate === null) {
    // TVA mixte: calculer le taux effectif (taxAmount / subtotal * 100)
    taxRate = calculated.subtotal > 0 
      ? Math.round((calculated.taxAmount / calculated.subtotal) * 10000) / 100
      : 20
  }

  // Dates
  const issueDate = new Date().toISOString().split('T')[0]
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Gestion de l'acompte déjà payé
  const depositPaid = quote.deposit_status === 'paid' && quote.deposit_amount
    ? quote.deposit_amount
    : 0
  
  // Notes incluant l'acompte si payé
  let notes = `Facture générée depuis le devis ${quote.quote_number}`
  if (depositPaid > 0) {
    const depositDate = quote.deposit_paid_at 
      ? new Date(quote.deposit_paid_at).toLocaleDateString('fr-FR')
      : 'date inconnue'
    notes += `\nAcompte de ${depositPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} déjà versé le ${depositDate}`
    if (quote.deposit_method) {
      const methodLabels: Record<string, string> = {
        virement: 'par virement',
        cash: 'en espèces',
        cheque: 'par chèque',
        autre: ''
      }
      notes += ` ${methodLabels[quote.deposit_method] || ''}`
    }
  }

  return {
    quote_id: quote.id,
    client_id: client.id,
    client_name: client.name,
    client_email: client.email || '',
    client_phone: client.phone || '',
    client_address: formatClientAddress(client),
    client_siret: client.siret || '', // ✅ Récupéré depuis le client
    subtotal: calculated.subtotal,
    tax_rate: taxRate,
    tax_amount: calculated.taxAmount,
    total: calculated.total,
    paid_amount: depositPaid, // ✅ Acompte déjà payé
    payment_status: depositPaid > 0 ? 'partial' : 'draft', // ✅ Statut partiel si acompte payé
    issue_date: issueDate,
    due_date: dueDate,
    payment_terms: 'Paiement à 30 jours',
    notes: notes.trim(),
    items: quote.items.map((item, idx) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price_ht,
      total: Math.round(item.quantity * item.unit_price_ht * 100) / 100,
      sort_order: idx,
      vat_rate: item.vat_rate, // ✅ TVA par item
    })),
  }
}

/**
 * Crée une facture à partir d'un devis
 * Fonction réutilisable pour desktop et mobile
 */
export async function createInvoiceFromQuote(
  quote: Quote,
  client: Client
): Promise<{ success: true; invoiceId: string; invoiceNumber: string } | { success: false; error: string }> {
  try {
    // Préparer les données avec validation
    const invoiceData = prepareInvoiceDataFromQuote(quote, client)

    // Appel API
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erreur lors de la création de la facture',
      }
    }

    return {
      success: true,
      invoiceId: data.invoice.id,
      invoiceNumber: data.invoice.invoice_number,
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
