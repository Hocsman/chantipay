import * as XLSX from 'xlsx'

interface QuoteItem {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface Quote {
  id: string
  quote_number: string
  created_at: string
  status: string
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  total_ht: number
  total_ttc: number
  total_vat: number
  valid_until?: string
  signed_at?: string
  quote_items?: QuoteItem[]
}

interface ExportOptions {
  includeItems?: boolean
  dateFormat?: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  signed: 'Signé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
  invoiced: 'Facturé',
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Génère un fichier Excel pour une liste de devis
 */
export function generateQuotesExcel(
  quotes: Quote[],
  options: ExportOptions = {}
): XLSX.WorkBook {
  const { includeItems = false } = options

  const workbook = XLSX.utils.book_new()

  // Feuille principale : Liste des devis
  const quotesData = quotes.map((quote) => ({
    'N° Devis': quote.quote_number || quote.id.slice(0, 8),
    'Date': formatDate(quote.created_at),
    'Client': quote.client_name,
    'Email': quote.client_email || '',
    'Téléphone': quote.client_phone || '',
    'Statut': STATUS_LABELS[quote.status] || quote.status,
    'Total HT': quote.total_ht,
    'TVA': quote.total_vat,
    'Total TTC': quote.total_ttc,
    'Validité': formatDate(quote.valid_until),
    'Signé le': formatDate(quote.signed_at),
  }))

  const quotesSheet = XLSX.utils.json_to_sheet(quotesData)

  // Ajuster la largeur des colonnes
  quotesSheet['!cols'] = [
    { wch: 12 }, // N° Devis
    { wch: 12 }, // Date
    { wch: 25 }, // Client
    { wch: 25 }, // Email
    { wch: 15 }, // Téléphone
    { wch: 12 }, // Statut
    { wch: 12 }, // Total HT
    { wch: 10 }, // TVA
    { wch: 12 }, // Total TTC
    { wch: 12 }, // Validité
    { wch: 12 }, // Signé le
  ]

  XLSX.utils.book_append_sheet(workbook, quotesSheet, 'Devis')

  // Feuille détaillée : Lignes de devis (optionnel)
  if (includeItems) {
    const itemsData: Record<string, unknown>[] = []

    quotes.forEach((quote) => {
      if (quote.quote_items && quote.quote_items.length > 0) {
        quote.quote_items.forEach((item) => {
          itemsData.push({
            'N° Devis': quote.quote_number || quote.id.slice(0, 8),
            'Client': quote.client_name,
            'Description': item.description,
            'Quantité': item.quantity,
            'Prix unitaire HT': item.unit_price_ht,
            'TVA %': item.vat_rate,
            'Total ligne HT': item.quantity * item.unit_price_ht,
          })
        })
      }
    })

    if (itemsData.length > 0) {
      const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
      itemsSheet['!cols'] = [
        { wch: 12 }, // N° Devis
        { wch: 25 }, // Client
        { wch: 40 }, // Description
        { wch: 10 }, // Quantité
        { wch: 15 }, // Prix unitaire HT
        { wch: 8 },  // TVA %
        { wch: 15 }, // Total ligne HT
      ]
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Détail lignes')
    }
  }

  // Feuille récapitulative
  const summary = {
    'Total devis': quotes.length,
    'Devis signés': quotes.filter((q) => q.status === 'signed').length,
    'Devis en attente': quotes.filter((q) => ['draft', 'sent'].includes(q.status)).length,
    'Total HT': quotes.reduce((sum, q) => sum + (q.total_ht || 0), 0),
    'Total TTC': quotes.reduce((sum, q) => sum + (q.total_ttc || 0), 0),
  }

  const summaryData = Object.entries(summary).map(([key, value]) => ({
    'Métrique': key,
    'Valeur': typeof value === 'number' && key.includes('Total')
      ? formatCurrency(value)
      : value,
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Récapitulatif')

  return workbook
}

/**
 * Génère un fichier Excel pour un seul devis avec détails
 */
export function generateSingleQuoteExcel(quote: Quote): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Informations générales
  const infoData = [
    { 'Champ': 'N° Devis', 'Valeur': quote.quote_number || quote.id.slice(0, 8) },
    { 'Champ': 'Date de création', 'Valeur': formatDate(quote.created_at) },
    { 'Champ': 'Statut', 'Valeur': STATUS_LABELS[quote.status] || quote.status },
    { 'Champ': 'Client', 'Valeur': quote.client_name },
    { 'Champ': 'Email', 'Valeur': quote.client_email || '' },
    { 'Champ': 'Téléphone', 'Valeur': quote.client_phone || '' },
    { 'Champ': 'Adresse', 'Valeur': quote.client_address || '' },
    { 'Champ': 'Validité', 'Valeur': formatDate(quote.valid_until) },
    { 'Champ': 'Signé le', 'Valeur': formatDate(quote.signed_at) },
    { 'Champ': '', 'Valeur': '' },
    { 'Champ': 'Total HT', 'Valeur': formatCurrency(quote.total_ht) },
    { 'Champ': 'Total TVA', 'Valeur': formatCurrency(quote.total_vat) },
    { 'Champ': 'Total TTC', 'Valeur': formatCurrency(quote.total_ttc) },
  ]

  const infoSheet = XLSX.utils.json_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informations')

  // Lignes du devis
  if (quote.quote_items && quote.quote_items.length > 0) {
    const itemsData = quote.quote_items.map((item) => ({
      'Description': item.description,
      'Quantité': item.quantity,
      'Prix unitaire HT': item.unit_price_ht,
      'TVA %': item.vat_rate,
      'Total HT': item.quantity * item.unit_price_ht,
      'TVA': (item.quantity * item.unit_price_ht * item.vat_rate) / 100,
      'Total TTC': item.quantity * item.unit_price_ht * (1 + item.vat_rate / 100),
    }))

    const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
    itemsSheet['!cols'] = [
      { wch: 40 }, // Description
      { wch: 10 }, // Quantité
      { wch: 15 }, // Prix unitaire HT
      { wch: 8 },  // TVA %
      { wch: 12 }, // Total HT
      { wch: 10 }, // TVA
      { wch: 12 }, // Total TTC
    ]
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Lignes du devis')
  }

  return workbook
}

/**
 * Convertit un workbook en ArrayBuffer pour le téléchargement
 */
export function workbookToBuffer(workbook: XLSX.WorkBook): ArrayBuffer {
  const uint8Array = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as Uint8Array
  return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength) as ArrayBuffer
}
