import * as XLSX from 'xlsx'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface Invoice {
  id: string
  invoice_number: string
  created_at: string
  due_date?: string
  status: string
  client_name: string
  client_email?: string
  client_phone?: string
  client_address?: string
  total_ht: number
  total_ttc: number
  total_vat: number
  paid_at?: string
  payment_method?: string
  invoice_items?: InvoiceItem[]
}

interface ExportOptions {
  includeItems?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  partial: 'Paiement partiel',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: 'Virement',
  check: 'Chèque',
  cash: 'Espèces',
  card: 'Carte bancaire',
  other: 'Autre',
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
 * Génère un fichier Excel pour une liste de factures
 */
export function generateInvoicesExcel(
  invoices: Invoice[],
  options: ExportOptions = {}
): XLSX.WorkBook {
  const { includeItems = false } = options

  const workbook = XLSX.utils.book_new()

  // Feuille principale : Liste des factures
  const invoicesData = invoices.map((invoice) => ({
    'N° Facture': invoice.invoice_number || invoice.id.slice(0, 8),
    'Date': formatDate(invoice.created_at),
    'Échéance': formatDate(invoice.due_date),
    'Client': invoice.client_name,
    'Email': invoice.client_email || '',
    'Statut': STATUS_LABELS[invoice.status] || invoice.status,
    'Total HT': invoice.total_ht,
    'TVA': invoice.total_vat,
    'Total TTC': invoice.total_ttc,
    'Payée le': formatDate(invoice.paid_at),
    'Mode paiement': PAYMENT_LABELS[invoice.payment_method || ''] || invoice.payment_method || '',
  }))

  const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData)
  invoicesSheet['!cols'] = [
    { wch: 12 }, // N° Facture
    { wch: 12 }, // Date
    { wch: 12 }, // Échéance
    { wch: 25 }, // Client
    { wch: 25 }, // Email
    { wch: 15 }, // Statut
    { wch: 12 }, // Total HT
    { wch: 10 }, // TVA
    { wch: 12 }, // Total TTC
    { wch: 12 }, // Payée le
    { wch: 15 }, // Mode paiement
  ]

  XLSX.utils.book_append_sheet(workbook, invoicesSheet, 'Factures')

  // Feuille détaillée : Lignes de factures (optionnel)
  if (includeItems) {
    const itemsData: Record<string, unknown>[] = []

    invoices.forEach((invoice) => {
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        invoice.invoice_items.forEach((item) => {
          itemsData.push({
            'N° Facture': invoice.invoice_number || invoice.id.slice(0, 8),
            'Client': invoice.client_name,
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
        { wch: 12 }, // N° Facture
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
  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const unpaidInvoices = invoices.filter((i) => ['sent', 'overdue', 'partial'].includes(i.status))

  const summary = {
    'Total factures': invoices.length,
    'Factures payées': paidInvoices.length,
    'Factures en attente': unpaidInvoices.length,
    'CA encaissé (TTC)': paidInvoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
    'En attente de paiement (TTC)': unpaidInvoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
    'Total HT': invoices.reduce((sum, i) => sum + (i.total_ht || 0), 0),
    'Total TVA collectée': invoices.reduce((sum, i) => sum + (i.total_vat || 0), 0),
    'Total TTC': invoices.reduce((sum, i) => sum + (i.total_ttc || 0), 0),
  }

  const summaryData = Object.entries(summary).map(([key, value]) => ({
    'Métrique': key,
    'Valeur': typeof value === 'number' && (key.includes('Total') || key.includes('CA') || key.includes('attente'))
      ? formatCurrency(value)
      : value,
  }))

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Récapitulatif')

  return workbook
}

/**
 * Génère un fichier Excel pour une seule facture avec détails
 */
export function generateSingleInvoiceExcel(invoice: Invoice): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Informations générales
  const infoData = [
    { 'Champ': 'N° Facture', 'Valeur': invoice.invoice_number || invoice.id.slice(0, 8) },
    { 'Champ': 'Date de création', 'Valeur': formatDate(invoice.created_at) },
    { 'Champ': 'Date d\'échéance', 'Valeur': formatDate(invoice.due_date) },
    { 'Champ': 'Statut', 'Valeur': STATUS_LABELS[invoice.status] || invoice.status },
    { 'Champ': 'Client', 'Valeur': invoice.client_name },
    { 'Champ': 'Email', 'Valeur': invoice.client_email || '' },
    { 'Champ': 'Téléphone', 'Valeur': invoice.client_phone || '' },
    { 'Champ': 'Adresse', 'Valeur': invoice.client_address || '' },
    { 'Champ': '', 'Valeur': '' },
    { 'Champ': 'Payée le', 'Valeur': formatDate(invoice.paid_at) },
    { 'Champ': 'Mode de paiement', 'Valeur': PAYMENT_LABELS[invoice.payment_method || ''] || '' },
    { 'Champ': '', 'Valeur': '' },
    { 'Champ': 'Total HT', 'Valeur': formatCurrency(invoice.total_ht) },
    { 'Champ': 'Total TVA', 'Valeur': formatCurrency(invoice.total_vat) },
    { 'Champ': 'Total TTC', 'Valeur': formatCurrency(invoice.total_ttc) },
  ]

  const infoSheet = XLSX.utils.json_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informations')

  // Lignes de la facture
  if (invoice.invoice_items && invoice.invoice_items.length > 0) {
    const itemsData = invoice.invoice_items.map((item) => ({
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
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Lignes de facture')
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
