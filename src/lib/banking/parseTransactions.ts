/**
 * ===========================================
 * Bank Transaction Parser (CSV + OFX)
 * ===========================================
 * Parse les relevés bancaires exportés par les banques françaises.
 * Supporte CSV (Crédit Agricole, LCL, Boursorama, etc.) et OFX.
 */

export interface ParsedTransaction {
  date: string       // ISO (YYYY-MM-DD)
  label: string
  amount: number     // Positif = crédit, négatif = débit
  reference: string  // Référence facture extraite (ou vide)
  rawLine: string    // Pour le hash anti-doublon
}

// ============================================
// Détection et dispatch
// ============================================

export function detectAndParse(content: string, filename: string): ParsedTransaction[] {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.ofx') || lower.endsWith('.qfx')) {
    return parseOFX(content)
  }
  // Par défaut : CSV
  return parseCSV(content)
}

// ============================================
// CSV Parser
// ============================================

/** Nettoie un montant français : "1 234,56" → 1234.56 */
function parseFrenchAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0
  const cleaned = raw
    .trim()
    .replace(/\s/g, '')      // Supprime espaces (séparateur milliers)
    .replace(/\u00A0/g, '')  // Supprime espaces insécables
    .replace(',', '.')        // Virgule → point décimal
  return parseFloat(cleaned) || 0
}

/** Détecte le séparateur CSV (;  ou ,  ou \t) */
function detectSeparator(firstLine: string): string {
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  const tabs = (firstLine.match(/\t/g) || []).length
  if (tabs >= 2) return '\t'
  if (semicolons >= commas) return ';'
  return ','
}

/** Parse une date française : DD/MM/YYYY ou DD-MM-YYYY → YYYY-MM-DD */
function parseFrenchDate(raw: string): string {
  const trimmed = raw.trim().replace(/"/g, '')
  // DD/MM/YYYY
  const match = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (match) {
    const day = match[1].padStart(2, '0')
    const month = match[2].padStart(2, '0')
    return `${match[3]}-${month}-${day}`
  }
  // YYYY-MM-DD (déjà ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  return trimmed
}

/** Trouve l'index de la colonne par noms possibles */
function findColumnIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(h => h.toLowerCase().trim().replace(/"/g, ''))
  for (const name of names) {
    const idx = normalized.indexOf(name.toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const separator = detectSeparator(lines[0])
  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''))

  // Trouver les colonnes
  const dateIdx = findColumnIndex(headers, ['date', 'date opération', 'date operation', 'date comptable', 'date valeur'])
  const labelIdx = findColumnIndex(headers, ['libellé', 'libelle', 'label', 'description', 'intitulé', 'intitule', 'détail', 'detail'])
  const amountIdx = findColumnIndex(headers, ['montant', 'amount', 'montant (eur)', 'montant eur'])
  const debitIdx = findColumnIndex(headers, ['débit', 'debit', 'débit (eur)', 'debit eur'])
  const creditIdx = findColumnIndex(headers, ['crédit', 'credit', 'crédit (eur)', 'credit eur'])

  if (dateIdx === -1 || labelIdx === -1) {
    throw new Error('Format CSV non reconnu : colonnes "Date" et "Libellé" introuvables')
  }
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) {
    throw new Error('Format CSV non reconnu : colonne "Montant" ou "Débit/Crédit" introuvable')
  }

  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''))

    const dateRaw = cols[dateIdx] || ''
    const label = cols[labelIdx] || ''
    if (!dateRaw || !label) continue

    let amount: number
    if (amountIdx >= 0) {
      amount = parseFrenchAmount(cols[amountIdx] || '0')
    } else {
      const debit = parseFrenchAmount(cols[debitIdx] || '0')
      const credit = parseFrenchAmount(cols[creditIdx] || '0')
      amount = credit > 0 ? credit : -Math.abs(debit)
    }

    if (amount === 0) continue

    transactions.push({
      date: parseFrenchDate(dateRaw),
      label,
      amount,
      reference: extractInvoiceReference(label),
      rawLine: lines[i],
    })
  }

  return transactions
}

// ============================================
// OFX Parser
// ============================================

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []

  // Extraire chaque bloc <STMTTRN>...</STMTTRN>
  const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  let match

  while ((match = txRegex.exec(content)) !== null) {
    const block = match[1]

    const dateMatch = block.match(/<DTPOSTED>(\d{8})/)
    const amountMatch = block.match(/<TRNAMT>([-\d.,]+)/)
    const nameMatch = block.match(/<NAME>([^<\n]+)/)
    const memoMatch = block.match(/<MEMO>([^<\n]+)/)
    const fitidMatch = block.match(/<FITID>([^<\n]+)/)

    if (!dateMatch || !amountMatch) continue

    const dateStr = dateMatch[1]
    const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
    const amount = parseFloat(amountMatch[1].replace(',', '.')) || 0
    const label = (nameMatch?.[1] || memoMatch?.[1] || '').trim()
    const fitid = fitidMatch?.[1]?.trim() || ''

    if (amount === 0 || !label) continue

    transactions.push({
      date,
      label,
      amount,
      reference: extractInvoiceReference(label + ' ' + fitid),
      rawLine: `${date}|${label}|${amount}|${fitid}`,
    })
  }

  // Fallback : OFX sans balises XML (format SGML)
  if (transactions.length === 0) {
    return parseOFXSgml(content)
  }

  return transactions
}

/** Parse OFX en format SGML (sans balises fermantes) */
function parseOFXSgml(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const lines = content.split(/\r?\n/)

  let current: Partial<{ date: string; amount: number; label: string; fitid: string }> = {}

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('<DTPOSTED>')) {
      const val = trimmed.replace('<DTPOSTED>', '').trim()
      if (val.length >= 8) {
        current.date = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`
      }
    } else if (trimmed.startsWith('<TRNAMT>')) {
      current.amount = parseFloat(trimmed.replace('<TRNAMT>', '').replace(',', '.')) || 0
    } else if (trimmed.startsWith('<NAME>')) {
      current.label = trimmed.replace('<NAME>', '').trim()
    } else if (trimmed.startsWith('<MEMO>')) {
      if (!current.label) {
        current.label = trimmed.replace('<MEMO>', '').trim()
      }
    } else if (trimmed.startsWith('<FITID>')) {
      current.fitid = trimmed.replace('<FITID>', '').trim()
    } else if (trimmed === '</STMTTRN>' || (trimmed.startsWith('<STMTTRN>') && current.date)) {
      if (current.date && current.amount && current.label) {
        transactions.push({
          date: current.date,
          label: current.label,
          amount: current.amount,
          reference: extractInvoiceReference(current.label + ' ' + (current.fitid || '')),
          rawLine: `${current.date}|${current.label}|${current.amount}|${current.fitid || ''}`,
        })
      }
      current = {}
    }
  }

  // Dernière transaction si pas de balise fermante
  if (current.date && current.amount && current.label) {
    transactions.push({
      date: current.date,
      label: current.label,
      amount: current.amount,
      reference: extractInvoiceReference(current.label + ' ' + (current.fitid || '')),
      rawLine: `${current.date}|${current.label}|${current.amount}|${current.fitid || ''}`,
    })
  }

  return transactions
}

// ============================================
// Extraction de référence facture
// ============================================

/** Extrait une référence de facture depuis un libellé bancaire */
export function extractInvoiceReference(label: string): string {
  if (!label) return ''

  // Pattern 1 : FAC-2025-001, FAC 2025 001, FACTURE-2025-001
  const facPattern = /(?:FAC(?:TURE)?[-\s]?)(\d{4}[-\s]?\d{1,5})/i
  const facMatch = label.match(facPattern)
  if (facMatch) {
    // Normaliser : FAC-2025-001
    return 'FAC-' + facMatch[1].replace(/\s/g, '-')
  }

  // Pattern 2 : Numéro type 2025-001 ou 2025/001
  const numPattern = /\b(20\d{2}[-/]\d{1,5})\b/
  const numMatch = label.match(numPattern)
  if (numMatch) {
    return numMatch[1].replace('/', '-')
  }

  return ''
}

// ============================================
// Hash pour anti-doublon
// ============================================

/** Génère un hash simple pour détecter les doublons (pas crypto, juste fonctionnel) */
export function hashTransaction(tx: ParsedTransaction): string {
  const raw = `${tx.date}|${tx.label}|${tx.amount}`
  // Simple hash string (pas besoin de crypto pour de l'anti-doublon)
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // 32bit int
  }
  return Math.abs(hash).toString(36) + '_' + raw.length
}
