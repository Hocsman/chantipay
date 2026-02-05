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
}

interface CompanyInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  siret?: string
  logo?: string
}

/**
 * Charger une image depuis une URL et la convertir en data URL base64
 */
async function loadImageAsBase64(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
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
    const dataUrl = `data:${contentType};base64,${base64}`

    return { dataUrl, width: 100, height: 100 }
  } catch (error) {
    console.error('Erreur chargement logo:', error)
    return null
  }
}

/**
 * Générer un PDF de facture
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  companyInfo: CompanyInfo
): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const rightCol = pageWidth - margin

  // Couleurs du thème - Noir, Blanc, Orange (ChantiPay)
  const primaryColor: [number, number, number] = [31, 41, 55] // gray-800 (noir)
  const accentColor: [number, number, number] = [249, 115, 22] // orange-500
  const secondaryColor: [number, number, number] = [107, 114, 128] // gray-500
  const darkColor: [number, number, number] = [31, 41, 55] // gray-800

  let yPos = margin

  // ============================================
  // EN-TÊTE - Bandeau noir professionnel
  // ============================================

  // Charger le logo si disponible
  let logoImage: { dataUrl: string; width: number; height: number } | null = null
  if (companyInfo.logo) {
    logoImage = await loadImageAsBase64(companyInfo.logo)
  }

  // Bandeau de couleur en haut (noir)
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Position du texte de l'entreprise (décalé si logo présent)
  let companyTextX = margin

  // Afficher le logo dans le bandeau (à gauche)
  if (logoImage) {
    const logoHeight = 30
    const logoY = 7.5 // centré verticalement dans le bandeau de 45px
    // Calculer la largeur proportionnelle (ratio carré par défaut)
    const logoWidth = logoHeight
    doc.addImage(logoImage.dataUrl, 'PNG', margin, logoY, logoWidth, logoHeight)
    companyTextX = margin + logoWidth + 5
  }

  // Nom de l'entreprise (à gauche dans le bandeau, après le logo)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(companyInfo.name || 'Mon Entreprise', companyTextX, 20)

  // Sous-titre (type d'activité)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(209, 213, 219) // gray-300
  doc.text('Artisan professionnel', companyTextX, 28)

  // Numéro de facture (à droite dans le bandeau)
  doc.setFontSize(10)
  doc.setTextColor(209, 213, 219) // gray-300
  doc.text('FACTURE', rightCol, 15, { align: 'right' })
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(invoice.invoice_number, rightCol, 25, { align: 'right' })

  // Statut de paiement (badge dans le bandeau)
  const statusInfo = getPaymentStatusInfo(invoice.payment_status)
  doc.setFillColor(...statusInfo.color)
  doc.roundedRect(rightCol - 35, 31, 35, 8, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(statusInfo.label, rightCol - 17.5, 36.5, { align: 'center' })

  // ============================================
  // INFORMATIONS ENTREPRISE (sous le bandeau, à droite)
  // ============================================

  yPos = 55
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)

  if (companyInfo.address) {
    doc.text(companyInfo.address, rightCol, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.phone) {
    doc.text(`Tél : ${companyInfo.phone}`, rightCol, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.email) {
    doc.text(companyInfo.email, rightCol, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.siret) {
    doc.text(`SIRET : ${companyInfo.siret}`, rightCol, yPos, { align: 'right' })
    yPos += 5
  }

  // ============================================
  // DATES (à gauche, sous le bandeau)
  // ============================================

  let leftY = 55
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkColor)
  doc.text(`Date d'émission : ${formatDate(invoice.issue_date)}`, margin, leftY)
  leftY += 6

  if (invoice.due_date) {
    doc.setTextColor(234, 88, 12) // orange-600
    doc.text(`Date d'échéance : ${formatDate(invoice.due_date)}`, margin, leftY)
    leftY += 6
  }

  yPos = Math.max(yPos, leftY) + 12

  // ============================================
  // INFORMATIONS CLIENT (encadré gris)
  // ============================================

  const clientBoxY = yPos
  const clientBoxHeight = 35

  doc.setFillColor(249, 250, 251) // gray-50
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.setLineWidth(0.5)
  doc.roundedRect(margin, clientBoxY, pageWidth - 2 * margin, clientBoxHeight, 3, 3, 'FD')

  yPos = clientBoxY + 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...secondaryColor)
  doc.text('FACTURÉ À', margin + 5, yPos)
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...darkColor)
  doc.text(invoice.client_name, margin + 5, yPos)
  yPos += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...secondaryColor)

  if (invoice.client_address) {
    doc.text(invoice.client_address, margin + 5, yPos)
    yPos += 5
  }

  // Email et téléphone sur la même ligne
  const clientDetails: string[] = []
  if (invoice.client_phone) clientDetails.push(`Tél : ${invoice.client_phone}`)
  if (invoice.client_email) clientDetails.push(invoice.client_email)
  if (clientDetails.length > 0) {
    doc.text(clientDetails.join('  •  '), margin + 5, yPos)
  }

  yPos = clientBoxY + clientBoxHeight + 10

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
    head: [['Description', 'Qté', 'Prix unitaire HT', 'TVA', 'Total HT']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    didParseCell: function (data) {
      // Colorier les cellules TVA selon le taux
      if (data.column.index === 3 && data.section === 'body') {
        const vatRate = parseFloat(data.cell.text[0])
        if (vatRate === 20) {
          data.cell.styles.fillColor = [219, 234, 254] // blue-100
          data.cell.styles.textColor = [29, 78, 216] // blue-700
        } else if (vatRate === 10) {
          data.cell.styles.fillColor = [220, 252, 231] // green-100
          data.cell.styles.textColor = [21, 128, 61] // green-700
        } else if (vatRate === 5.5) {
          data.cell.styles.fillColor = [254, 243, 199] // yellow-100
          data.cell.styles.textColor = [161, 98, 7] // yellow-700
        } else {
          data.cell.styles.fillColor = [243, 244, 246] // gray-100
          data.cell.styles.textColor = [55, 65, 81] // gray-700
        }
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // @ts-ignore - autoTable modifie lastAutoTable
  yPos = doc.lastAutoTable.finalY + 10

  // ============================================
  // RÉCAPITULATIF TVA (si taux multiples)
  // ============================================

  // Calculer les groupes de TVA
  const vatGroups: Record<number, { base: number; tax: number }> = {}
  invoice.items.forEach((item) => {
    const rate = item.vat_rate ?? invoice.tax_rate
    if (!vatGroups[rate]) {
      vatGroups[rate] = { base: 0, tax: 0 }
    }
    vatGroups[rate].base += item.total
    vatGroups[rate].tax += item.total * (rate / 100)
  })

  const vatRates = Object.keys(vatGroups)

  // Afficher le récapitulatif si plusieurs taux de TVA
  if (vatRates.length > 1) {
    const boxHeight = 10 + vatRates.length * 6
    doc.setFillColor(254, 243, 199) // amber-100
    doc.setDrawColor(251, 191, 36) // amber-400
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, yPos, pageWidth / 2 - margin - 5, boxHeight, 3, 3, 'FD')

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(146, 64, 14) // amber-800
    doc.text('Détail TVA (taux multiples)', margin + 4, yPos + 6)

    let vatY = yPos + 12
    doc.setFont('helvetica', 'normal')
    Object.entries(vatGroups).forEach(([rate, values]) => {
      doc.setTextColor(107, 114, 128)
      doc.text(`TVA ${rate}% (base: ${formatCurrency(values.base)})`, margin + 4, vatY)
      doc.setTextColor(60, 60, 60)
      doc.text(formatCurrency(values.tax), pageWidth / 2 - margin - 8, vatY, { align: 'right' })
      vatY += 6
    })
  }

  // ============================================
  // TOTAUX (encadré à droite)
  // ============================================

  const totalsBoxWidth = pageWidth / 2 - margin - 5
  const totalsBoxX = pageWidth / 2 + 5
  
  // Calculer la hauteur en fonction de si on a un acompte ou non
  const hasDeposit = invoice.paid_amount && invoice.paid_amount > 0
  const totalsBoxHeight = hasDeposit ? 72 : 48

  // Cadre pour les totaux
  doc.setFillColor(249, 250, 251) // gray-50
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.setLineWidth(0.5)
  doc.roundedRect(totalsBoxX, yPos, totalsBoxWidth, totalsBoxHeight, 3, 3, 'FD')

  let totalsY = yPos + 10
  const labelX = totalsBoxX + 8
  const valueX = totalsBoxX + totalsBoxWidth - 8

  // Sous-total HT
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Sous-total HT', labelX, totalsY)
  doc.setTextColor(...darkColor)
  doc.text(formatCurrency(invoice.subtotal), valueX, totalsY, { align: 'right' })
  totalsY += 8

  // TVA
  doc.setTextColor(...secondaryColor)
  doc.text(`TVA (${invoice.tax_rate}%)`, labelX, totalsY)
  doc.setTextColor(...darkColor)
  doc.text(formatCurrency(invoice.tax_amount), valueX, totalsY, { align: 'right' })
  totalsY += 10

  // Ligne de séparation (orange)
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1)
  doc.line(labelX, totalsY - 3, valueX, totalsY - 3)

  // Total TTC (orange)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...accentColor)
  doc.text('Total TTC', labelX, totalsY + 5)
  doc.text(formatCurrency(invoice.total), valueX, totalsY + 5, { align: 'right' })
  totalsY += 12

  // Acompte déjà versé (si applicable)
  if (hasDeposit) {
    totalsY += 3
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74) // green-600
    doc.text('Acompte versé', labelX, totalsY)
    doc.text(`- ${formatCurrency(invoice.paid_amount!)}`, valueX, totalsY, { align: 'right' })
    totalsY += 8

    // Reste à payer (en gras, orange)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(234, 88, 12) // orange-600
    doc.text('RESTE À PAYER', labelX, totalsY)
    const remainingAmount = invoice.total - invoice.paid_amount!
    doc.text(formatCurrency(remainingAmount), valueX, totalsY, { align: 'right' })
  }

  yPos = yPos + totalsBoxHeight + 10

  // ============================================
  // CONDITIONS DE PAIEMENT
  // ============================================

  if (invoice.payment_terms) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...secondaryColor)
    doc.text(`Conditions : ${invoice.payment_terms}`, margin, yPos)
    yPos += 8
  }

  // ============================================
  // NOTES
  // ============================================

  if (invoice.notes) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Notes :', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...secondaryColor)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPos)
    yPos += splitNotes.length * 5
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  const footerY = pageHeight - 15

  // Ligne de séparation
  doc.setDrawColor(229, 231, 235) // gray-200
  doc.setLineWidth(0.5)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.setFont('helvetica', 'normal')
  doc.text('Merci de votre confiance', pageWidth / 2, footerY, { align: 'center' })

  doc.setFontSize(7)
  const footerInfo = `${companyInfo.name}${companyInfo.siret ? ` • SIRET: ${companyInfo.siret}` : ''}`
  doc.text(footerInfo, pageWidth / 2, footerY + 4, { align: 'center' })

  // Retourner le PDF en Blob
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
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
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
  color: [number, number, number]
} {
  const statusMap: Record<
    string,
    { label: string; color: [number, number, number] }
  > = {
    draft: { label: 'Brouillon', color: [107, 114, 128] }, // gray-500
    sent: { label: 'Envoyée', color: [59, 130, 246] }, // blue-500
    paid: { label: 'Payée', color: [16, 185, 129] }, // green-500
    partial: { label: 'Partiel', color: [251, 146, 60] }, // orange-400
    overdue: { label: 'En retard', color: [239, 68, 68] }, // red-500
    canceled: { label: 'Annulée', color: [156, 163, 175] }, // gray-400
  }
  return statusMap[status] || statusMap.draft
}
