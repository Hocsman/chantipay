import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
  vat_rate?: number
}

interface Invoice {
  invoice_number: string
  issue_date: string
  due_date?: string | null
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_address?: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  paid_amount?: number // Acompte déjà payé
  payment_status: string
  payment_terms?: string | null
  notes?: string | null
  items: InvoiceItem[]
  // Nouveaux champs
  work_location?: string | null
  is_subcontracting?: boolean
}

interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  siret?: string
  logo?: string
  // Nouveaux champs légaux
  rcs?: string
  vat_number?: string
  ape_code?: string
  share_capital?: string
  tax_status?: 'standard' | 'auto_entrepreneur' | 'micro_entreprise'
  is_subcontractor?: boolean
}

// ============================================
// Couleurs uniformisées avec le devis
// ============================================
const COLORS = {
  // Couleurs principales
  primary: [31, 41, 55] as [number, number, number],       // gray-800 (#1F2937)
  accent: [249, 115, 22] as [number, number, number],      // orange-500 (#F97316)

  // Texte
  textDark: [15, 23, 42] as [number, number, number],      // slate-900 (#0F172A)
  textPrimary: [51, 65, 85] as [number, number, number],   // slate-700 (#334155)
  textSecondary: [100, 116, 139] as [number, number, number], // slate-500 (#64748B)
  textMuted: [148, 163, 184] as [number, number, number],  // slate-400 (#94A3B8)

  // Fonds
  bgLight: [248, 250, 252] as [number, number, number],    // slate-50 (#F8FAFC)
  border: [226, 232, 240] as [number, number, number],     // slate-200 (#E2E8F0)

  // Statuts
  green: [5, 150, 105] as [number, number, number],        // green-600 (#059669)
  blue: [29, 78, 216] as [number, number, number],         // blue-700 (#1D4ED8)
  red: [220, 38, 38] as [number, number, number],          // red-600 (#DC2626)
}

/**
 * Charger une image depuis une URL et la convertir en data URL base64
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64 = btoa(binary)

    const contentType = response.headers.get('Content-Type') || 'image/png'
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Erreur chargement logo:', error)
    return null
  }
}

/**
 * Générer un PDF de facture (style uniformisé avec le devis)
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  companyInfo: CompanyInfo
): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 35
  const rightCol = pageWidth - margin

  let yPos = 30

  // ============================================
  // EN-TÊTE (style devis : fond blanc, bordure orange)
  // ============================================

  // Charger le logo si disponible
  let logoDataUrl: string | null = null
  if (companyInfo.logo) {
    logoDataUrl = await loadImageAsBase64(companyInfo.logo)
  }

  // Partie gauche : Logo + Infos entreprise
  let leftY = yPos

  // Logo (si disponible)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, leftY, 35, 17.5)
    leftY += 22
  }

  // Nom de l'entreprise
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text(companyInfo.name || 'Mon Entreprise', margin, leftY)
  leftY += 5

  // Infos entreprise
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)

  if (companyInfo.email) {
    doc.text(companyInfo.email, margin, leftY)
    leftY += 4
  }
  if (companyInfo.phone) {
    doc.text(companyInfo.phone, margin, leftY)
    leftY += 4
  }
  if (companyInfo.address) {
    doc.text(companyInfo.address, margin, leftY)
    leftY += 4
  }
  if (companyInfo.siret) {
    doc.text(`SIRET : ${companyInfo.siret}`, margin, leftY)
    leftY += 4
  }
  if (companyInfo.rcs) {
    doc.text(`RCS : ${companyInfo.rcs}`, margin, leftY)
    leftY += 4
  }
  if (companyInfo.vat_number) {
    doc.text(`TVA : ${companyInfo.vat_number}`, margin, leftY)
    leftY += 4
  }
  if (companyInfo.ape_code) {
    doc.text(`Code APE : ${companyInfo.ape_code}`, margin, leftY)
    leftY += 4
  }
  if (companyInfo.share_capital) {
    doc.text(`Capital : ${companyInfo.share_capital}`, margin, leftY)
    leftY += 4
  }

  // Partie droite : Titre FACTURE + infos
  let rightY = yPos

  // Titre FACTURE
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('FACTURE', rightCol, rightY, { align: 'right' })
  rightY += 8

  // Numéro de facture
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textPrimary)
  doc.text(`N° ${invoice.invoice_number}`, rightCol, rightY, { align: 'right' })
  rightY += 5

  // Date d'émission
  doc.text(`Date : ${formatDate(invoice.issue_date)}`, rightCol, rightY, { align: 'right' })
  rightY += 5

  // Date d'échéance
  if (invoice.due_date) {
    doc.text(`Échéance : ${formatDate(invoice.due_date)}`, rightCol, rightY, { align: 'right' })
    rightY += 5
  }

  // Badge statut
  rightY += 3
  const statusInfo = getPaymentStatusInfo(invoice.payment_status)
  const badgeWidth = doc.getTextWidth(statusInfo.label) + 10
  const badgeX = rightCol - badgeWidth

  doc.setFillColor(...statusInfo.bgColor)
  doc.roundedRect(badgeX, rightY - 4, badgeWidth, 7, 1.5, 1.5, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...statusInfo.textColor)
  doc.text(statusInfo.label, badgeX + badgeWidth / 2, rightY, { align: 'center' })

  // Ligne de séparation orange (comme le devis)
  yPos = Math.max(leftY, rightY) + 8
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(1)
  doc.line(margin, yPos, rightCol, yPos)

  yPos += 12

  // ============================================
  // SECTION CLIENT (encadré gris comme le devis)
  // ============================================

  const clientBoxY = yPos
  const clientBoxHeight = 38

  doc.setFillColor(...COLORS.bgLight)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, clientBoxY, pageWidth - 2 * margin, clientBoxHeight, 2, 2, 'FD')

  yPos = clientBoxY + 8

  // Titre "Client"
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.accent)
  doc.text('CLIENT', margin + 8, yPos)
  yPos += 7

  // Nom du client
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.textDark)
  doc.text(invoice.client_name, margin + 8, yPos)
  yPos += 5

  // Adresse et contact
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)

  if (invoice.client_address) {
    doc.text(invoice.client_address, margin + 8, yPos)
    yPos += 4
  }

  const clientContact: string[] = []
  if (invoice.client_email) clientContact.push(invoice.client_email)
  if (invoice.client_phone) clientContact.push(`Tél : ${invoice.client_phone}`)
  if (clientContact.length > 0) {
    doc.text(clientContact.join('  •  '), margin + 8, yPos)
  }

  yPos = clientBoxY + clientBoxHeight + 10

  // ============================================
  // LIEU D'INTERVENTION (si différent de l'adresse client)
  // ============================================

  if (invoice.work_location) {
    const workLocationBoxHeight = 22

    // Fond orange clair avec bordure orange
    doc.setFillColor(255, 247, 237) // #FFF7ED
    doc.setDrawColor(253, 186, 116) // #FDBA74
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, workLocationBoxHeight, 2, 2, 'FD')

    // Titre
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(234, 88, 12) // #EA580C
    doc.text("LIEU D'INTERVENTION", margin + 8, yPos + 8)

    // Adresse
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(154, 52, 18) // #9A3412
    doc.text(invoice.work_location, margin + 8, yPos + 15)

    yPos += workLocationBoxHeight + 8
  }

  // ============================================
  // TABLEAU DES ARTICLES
  // ============================================

  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    `${item.vat_rate ?? invoice.tax_rate}%`,
    formatCurrency(item.total),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Désignation', 'Qté', 'PU HT', 'TVA', 'Total HT']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.textPrimary,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: COLORS.bgLight,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  })

  // @ts-ignore - autoTable modifie lastAutoTable
  yPos = doc.lastAutoTable.finalY + 10

  // ============================================
  // TOTAUX (encadré à droite, style devis)
  // ============================================

  const totalsBoxWidth = 110
  const totalsBoxX = rightCol - totalsBoxWidth
  const hasDeposit = invoice.paid_amount && invoice.paid_amount > 0
  const totalsBoxHeight = hasDeposit ? 65 : 48

  doc.setFillColor(...COLORS.bgLight)
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.roundedRect(totalsBoxX, yPos, totalsBoxWidth, totalsBoxHeight, 2, 2, 'FD')

  let totalsY = yPos + 10
  const labelX = totalsBoxX + 8
  const valueX = totalsBoxX + totalsBoxWidth - 8

  // Total HT
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  doc.text('Total HT', labelX, totalsY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.textPrimary)
  doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: 'right' })
  totalsY += 7

  // TVA
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textSecondary)
  doc.text('TVA', labelX, totalsY)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.textPrimary)
  doc.text(formatCurrency(invoice.tax_amount), valueX, totalsY, { align: 'right' })
  totalsY += 9

  // Ligne de séparation orange
  doc.setDrawColor(...COLORS.accent)
  doc.setLineWidth(1)
  doc.line(labelX, totalsY - 2, valueX, totalsY - 2)

  // Total TTC
  totalsY += 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  doc.text('Total TTC', labelX, totalsY)
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.accent)
  doc.text(formatCurrency(invoice.total), valueX, totalsY, { align: 'right' })

  // Acompte (si applicable)
  if (hasDeposit) {
    totalsY += 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.green)
    doc.text('Acompte versé', labelX, totalsY)
    doc.setFont('helvetica', 'bold')
    doc.text(`- ${formatCurrency(invoice.paid_amount!)}`, valueX, totalsY, { align: 'right' })

    totalsY += 6
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.accent)
    doc.text('RESTE À PAYER', labelX, totalsY)
    const remainingAmount = invoice.total - invoice.paid_amount!
    doc.text(formatCurrency(remainingAmount), valueX, totalsY, { align: 'right' })
  }

  yPos = yPos + totalsBoxHeight + 10

  // ============================================
  // CONDITIONS DE PAIEMENT
  // ============================================

  if (invoice.payment_terms) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.textSecondary)
    doc.text(`Conditions : ${invoice.payment_terms}`, margin, yPos)
    yPos += 6
  }

  // ============================================
  // NOTES
  // ============================================

  if (invoice.notes) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.textPrimary)
    doc.text('Notes :', margin, yPos)
    yPos += 4
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.textSecondary)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPos)
  }

  // ============================================
  // PIED DE PAGE (style devis)
  // ============================================

  const footerY = pageHeight - 20

  // Ligne de séparation
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 6, rightCol, footerY - 6)

  // Mentions légales (auto-entrepreneur et sous-traitant)
  let legalY = footerY - 12

  // Mention auto-entrepreneur
  if (companyInfo.tax_status === 'auto_entrepreneur') {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.red)
    doc.text('TVA non applicable, article 293B du CGI', pageWidth / 2, legalY, { align: 'center' })
    legalY += 4
  }

  // Mention sous-traitance (autoliquidation)
  if (companyInfo.is_subcontractor || invoice.is_subcontracting) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.red)
    doc.text('Autoliquidation de la TVA - Article 283-2 nonies du CGI', pageWidth / 2, legalY, { align: 'center' })
  }

  // Texte footer
  doc.setFontSize(7)
  doc.setTextColor(...COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text('Merci de votre confiance', pageWidth / 2, footerY - 1, { align: 'center' })

  doc.setFontSize(6)
  doc.setTextColor(...COLORS.border)
  doc.text('Facture générée via ChantiPay • www.chantipay.com', pageWidth / 2, footerY + 3, { align: 'center' })

  return doc.output('blob')
}

/**
 * Télécharger le PDF
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  companyInfo: CompanyInfo
): Promise<void> {
  const pdfBlob = await generateInvoicePDF(invoice, companyInfo)
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${invoice.invoice_number}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Helpers
 */

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function getPaymentStatusInfo(status: string): {
  label: string
  bgColor: [number, number, number]
  textColor: [number, number, number]
} {
  const statusMap: Record<
    string,
    { label: string; bgColor: [number, number, number]; textColor: [number, number, number] }
  > = {
    draft: { label: 'Brouillon', bgColor: [241, 245, 249], textColor: [100, 116, 139] },      // slate
    sent: { label: 'Envoyée', bgColor: [219, 234, 254], textColor: [29, 78, 216] },          // blue
    paid: { label: 'Payée', bgColor: [209, 250, 229], textColor: [5, 150, 105] },            // green
    partial: { label: 'Partiel', bgColor: [254, 243, 199], textColor: [217, 119, 6] },       // amber
    overdue: { label: 'En retard', bgColor: [254, 226, 226], textColor: [220, 38, 38] },     // red
    canceled: { label: 'Annulée', bgColor: [254, 226, 226], textColor: [220, 38, 38] },      // red
  }
  return statusMap[status] || statusMap.draft
}
