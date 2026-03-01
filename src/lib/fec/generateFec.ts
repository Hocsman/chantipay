/**
 * ===========================================
 * FEC Generator (Fichier des Écritures Comptables)
 * ===========================================
 * Génère un fichier FEC conforme au standard fiscal français.
 * Format : TSV (tab-separated), UTF-8 avec BOM.
 *
 * Comptes utilisés :
 * - 411000 : Clients
 * - 706000 : Prestations de services
 * - 445710 : TVA collectée
 * - 512000 : Banque
 *
 * Journaux :
 * - VE : Ventes
 * - BQ : Banque
 */

// ============================================
// Types
// ============================================

export interface FecInvoice {
  invoice_number: string
  issue_date: string
  paid_at: string | null
  payment_status: string
  payment_method: string | null
  client_name: string
  client_siret: string | null
  client_id: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  paid_amount: number | null
}

export interface FecCreditNote {
  credit_note_number: string
  issue_date: string
  client_name: string
  client_siret: string | null
  client_id: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
}

export interface FecOptions {
  siren: string
  companyName: string
  taxStatus: string
  closingDate: string // ISO date (fin de période)
}

interface FecLine {
  JournalCode: string
  JournalLib: string
  EcritureNum: string
  EcritureDate: string
  CompteNum: string
  CompteLib: string
  CompAuxNum: string
  CompAuxLib: string
  PieceRef: string
  PieceDate: string
  EcritureLib: string
  Debit: string
  Credit: string
  EcritureLet: string
  DateLet: string
  ValidDate: string
  Montantdevise: string
  Idevise: string
}

// ============================================
// Helpers
// ============================================

const FEC_COLUMNS: (keyof FecLine)[] = [
  'JournalCode', 'JournalLib', 'EcritureNum', 'EcritureDate',
  'CompteNum', 'CompteLib', 'CompAuxNum', 'CompAuxLib',
  'PieceRef', 'PieceDate', 'EcritureLib', 'Debit', 'Credit',
  'EcritureLet', 'DateLet', 'ValidDate', 'Montantdevise', 'Idevise',
]

/** Format ISO date → YYYYMMDD */
function formatFecDate(isoDate: string): string {
  return isoDate.replace(/-/g, '').slice(0, 8)
}

/** Format number → FEC amount (virgule décimale, pas de séparateur milliers) */
function formatFecAmount(amount: number): string {
  return Math.abs(amount).toFixed(2).replace('.', ',')
}

/** Zéro FEC */
const ZERO = '0,00'

/** Générer un code auxiliaire client déterministe */
function getClientAuxAccount(
  clientName: string,
  clientSiret: string | null,
  clientId: string | null
): string {
  // Priorité : SIREN du client (9 premiers chiffres du SIRET)
  if (clientSiret) {
    const siren = clientSiret.replace(/\s/g, '').slice(0, 9)
    if (siren.length >= 9) return 'C' + siren
  }
  // Fallback : client_id (8 premiers chars)
  if (clientId) {
    return 'C' + clientId.replace(/-/g, '').slice(0, 8).toUpperCase()
  }
  // Dernier recours : nom client nettoyé
  return 'C' + clientName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8).padEnd(8, '0')
}

/** Générer un code de lettrage : AA, AB, ..., AZ, BA, BB, ... */
function getLetteringCode(index: number): string {
  const first = String.fromCharCode(65 + Math.floor(index / 26))
  const second = String.fromCharCode(65 + (index % 26))
  return first + second
}

/** Numéro d'écriture séquentiel : VE000001, BQ000001, etc. */
function entryNum(journal: string, seq: number): string {
  return journal + String(seq).padStart(6, '0')
}

// ============================================
// Générateur principal
// ============================================

export function generateFec(
  invoices: FecInvoice[],
  creditNotes: FecCreditNote[],
  options: FecOptions
): string {
  const lines: FecLine[] = []
  const isAutoEntrepreneur = options.taxStatus === 'auto_entrepreneur'

  let veSeq = 0
  let bqSeq = 0
  let letteringIndex = 0

  // Combiner et trier chronologiquement
  type DocEntry =
    | { type: 'invoice'; doc: FecInvoice; date: string }
    | { type: 'credit_note'; doc: FecCreditNote; date: string }

  const allDocs: DocEntry[] = [
    ...invoices.map((inv) => ({
      type: 'invoice' as const,
      doc: inv,
      date: inv.issue_date,
    })),
    ...creditNotes.map((cn) => ({
      type: 'credit_note' as const,
      doc: cn,
      date: cn.issue_date,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  for (const entry of allDocs) {
    if (entry.type === 'invoice') {
      const inv = entry.doc
      const fecDate = formatFecDate(inv.issue_date)
      const auxNum = getClientAuxAccount(inv.client_name, inv.client_siret, inv.client_id)
      const isPaid = inv.payment_status === 'paid' || inv.payment_status === 'partial'
      const paidAmount = inv.payment_status === 'partial'
        ? (inv.paid_amount || 0)
        : inv.total

      // Lettrage si payée
      let letterCode = ''
      let letterDate = ''
      if (isPaid && inv.paid_at) {
        letterCode = getLetteringCode(letteringIndex)
        letterDate = formatFecDate(inv.paid_at)
        letteringIndex++
      }

      // --- Journal VE : écriture de vente ---
      veSeq++
      const veNum = entryNum('VE', veSeq)

      // Ligne 1 : Débit client (TTC)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Journal des ventes',
        EcritureNum: veNum,
        EcritureDate: fecDate,
        CompteNum: '411000',
        CompteLib: 'Clients',
        CompAuxNum: auxNum,
        CompAuxLib: inv.client_name,
        PieceRef: inv.invoice_number,
        PieceDate: fecDate,
        EcritureLib: `Facture ${inv.invoice_number} - ${inv.client_name}`,
        Debit: formatFecAmount(inv.total),
        Credit: ZERO,
        EcritureLet: letterCode,
        DateLet: letterDate,
        ValidDate: fecDate,
        Montantdevise: '',
        Idevise: '',
      })

      // Ligne 2 : Crédit produit (HT)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Journal des ventes',
        EcritureNum: veNum,
        EcritureDate: fecDate,
        CompteNum: '706000',
        CompteLib: 'Prestations de services',
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: inv.invoice_number,
        PieceDate: fecDate,
        EcritureLib: `Facture ${inv.invoice_number} - ${inv.client_name}`,
        Debit: ZERO,
        Credit: formatFecAmount(inv.subtotal),
        EcritureLet: '',
        DateLet: '',
        ValidDate: fecDate,
        Montantdevise: '',
        Idevise: '',
      })

      // Ligne 3 : Crédit TVA (si applicable)
      if (!isAutoEntrepreneur && inv.tax_amount > 0) {
        lines.push({
          JournalCode: 'VE',
          JournalLib: 'Journal des ventes',
          EcritureNum: veNum,
          EcritureDate: fecDate,
          CompteNum: '445710',
          CompteLib: 'TVA collectée',
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: inv.invoice_number,
          PieceDate: fecDate,
          EcritureLib: `TVA Facture ${inv.invoice_number}`,
          Debit: ZERO,
          Credit: formatFecAmount(inv.tax_amount),
          EcritureLet: '',
          DateLet: '',
          ValidDate: fecDate,
          Montantdevise: '',
          Idevise: '',
        })
      }

      // --- Journal BQ : encaissement (si payée) ---
      if (isPaid && paidAmount > 0 && inv.paid_at) {
        bqSeq++
        const bqNum = entryNum('BQ', bqSeq)
        const bqDate = formatFecDate(inv.paid_at)

        // Ligne 1 : Débit banque
        lines.push({
          JournalCode: 'BQ',
          JournalLib: 'Journal de banque',
          EcritureNum: bqNum,
          EcritureDate: bqDate,
          CompteNum: '512000',
          CompteLib: 'Banque',
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: inv.invoice_number,
          PieceDate: fecDate,
          EcritureLib: `Règlement Facture ${inv.invoice_number}`,
          Debit: formatFecAmount(paidAmount),
          Credit: ZERO,
          EcritureLet: '',
          DateLet: '',
          ValidDate: bqDate,
          Montantdevise: '',
          Idevise: '',
        })

        // Ligne 2 : Crédit client
        lines.push({
          JournalCode: 'BQ',
          JournalLib: 'Journal de banque',
          EcritureNum: bqNum,
          EcritureDate: bqDate,
          CompteNum: '411000',
          CompteLib: 'Clients',
          CompAuxNum: auxNum,
          CompAuxLib: inv.client_name,
          PieceRef: inv.invoice_number,
          PieceDate: fecDate,
          EcritureLib: `Règlement Facture ${inv.invoice_number}`,
          Debit: ZERO,
          Credit: formatFecAmount(paidAmount),
          EcritureLet: letterCode,
          DateLet: letterDate,
          ValidDate: bqDate,
          Montantdevise: '',
          Idevise: '',
        })
      }
    } else {
      // --- Avoir (credit note) — écritures inversées ---
      const cn = entry.doc
      const fecDate = formatFecDate(cn.issue_date)
      const auxNum = getClientAuxAccount(cn.client_name, cn.client_siret, cn.client_id)
      const absSubtotal = Math.abs(cn.subtotal)
      const absTaxAmount = Math.abs(cn.tax_amount)
      const absTotal = Math.abs(cn.total)

      veSeq++
      const veNum = entryNum('VE', veSeq)

      // Ligne 1 : Crédit client (TTC) — inverse d'une facture
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Journal des ventes',
        EcritureNum: veNum,
        EcritureDate: fecDate,
        CompteNum: '411000',
        CompteLib: 'Clients',
        CompAuxNum: auxNum,
        CompAuxLib: cn.client_name,
        PieceRef: cn.credit_note_number,
        PieceDate: fecDate,
        EcritureLib: `Avoir ${cn.credit_note_number} - ${cn.client_name}`,
        Debit: ZERO,
        Credit: formatFecAmount(absTotal),
        EcritureLet: '',
        DateLet: '',
        ValidDate: fecDate,
        Montantdevise: '',
        Idevise: '',
      })

      // Ligne 2 : Débit produit (HT)
      lines.push({
        JournalCode: 'VE',
        JournalLib: 'Journal des ventes',
        EcritureNum: veNum,
        EcritureDate: fecDate,
        CompteNum: '706000',
        CompteLib: 'Prestations de services',
        CompAuxNum: '',
        CompAuxLib: '',
        PieceRef: cn.credit_note_number,
        PieceDate: fecDate,
        EcritureLib: `Avoir ${cn.credit_note_number} - ${cn.client_name}`,
        Debit: formatFecAmount(absSubtotal),
        Credit: ZERO,
        EcritureLet: '',
        DateLet: '',
        ValidDate: fecDate,
        Montantdevise: '',
        Idevise: '',
      })

      // Ligne 3 : Débit TVA (si applicable)
      if (!isAutoEntrepreneur && absTaxAmount > 0) {
        lines.push({
          JournalCode: 'VE',
          JournalLib: 'Journal des ventes',
          EcritureNum: veNum,
          EcritureDate: fecDate,
          CompteNum: '445710',
          CompteLib: 'TVA collectée',
          CompAuxNum: '',
          CompAuxLib: '',
          PieceRef: cn.credit_note_number,
          PieceDate: fecDate,
          EcritureLib: `TVA Avoir ${cn.credit_note_number}`,
          Debit: formatFecAmount(absTaxAmount),
          Credit: ZERO,
          EcritureLet: '',
          DateLet: '',
          ValidDate: fecDate,
          Montantdevise: '',
          Idevise: '',
        })
      }
    }
  }

  // Construire le fichier TSV
  const header = FEC_COLUMNS.join('\t')
  const rows = lines.map((line) =>
    FEC_COLUMNS.map((col) => line[col]).join('\t')
  )

  // BOM UTF-8 + header + lignes
  return '\uFEFF' + header + '\n' + rows.join('\n')
}

/**
 * Génère le nom de fichier FEC conforme : {SIREN}FEC{YYYYMMDD}.txt
 */
export function getFecFilename(siren: string, closingDate: string): string {
  const dateStr = formatFecDate(closingDate)
  return `${siren}FEC${dateStr}.txt`
}
