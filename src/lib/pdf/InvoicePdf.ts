import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
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

  // Couleurs du thème
  const primaryColor: [number, number, number] = [59, 130, 246] // blue-500
  const secondaryColor: [number, number, number] = [107, 114, 128] // gray-500
  const accentColor: [number, number, number] = [16, 185, 129] // green-500

  let yPos = margin

  // ============================================
  // EN-TÊTE
  // ============================================

  // Logo de l'entreprise (si disponible)
  if (companyInfo.logo) {
    try {
      doc.addImage(companyInfo.logo, 'PNG', margin, yPos, 40, 40)
    } catch (error) {
      console.error('Erreur chargement logo:', error)
    }
  }

  // Informations entreprise (à droite)
  doc.setFontSize(12)
  doc.setTextColor(...secondaryColor)
  const companyX = pageWidth - margin - 80
  doc.text(companyInfo.name, companyX, yPos, { align: 'right' })
  yPos += 6
  if (companyInfo.address) {
    doc.setFontSize(9)
    doc.text(companyInfo.address, companyX, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.phone) {
    doc.text(`Tél : ${companyInfo.phone}`, companyX, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.email) {
    doc.text(companyInfo.email, companyX, yPos, { align: 'right' })
    yPos += 5
  }
  if (companyInfo.siret) {
    doc.text(`SIRET : ${companyInfo.siret}`, companyX, yPos, { align: 'right' })
  }

  yPos = Math.max(yPos, 70)

  // ============================================
  // TITRE FACTURE
  // ============================================

  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('FACTURE', margin, yPos)
  yPos += 10

  // Numéro et dates
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`N° ${invoice.invoice_number}`, margin, yPos)
  yPos += 6
  doc.text(`Date d'émission : ${formatDate(invoice.issue_date)}`, margin, yPos)
  yPos += 6
  if (invoice.due_date) {
    doc.setTextColor(...secondaryColor)
    doc.text(`Date d'échéance : ${formatDate(invoice.due_date)}`, margin, yPos)
    yPos += 6
  }

  // Statut de paiement (badge coloré)
  const statusInfo = getPaymentStatusInfo(invoice.payment_status)
  yPos += 5
  doc.setFillColor(...statusInfo.color)
  doc.roundedRect(margin, yPos - 5, 35, 8, 2, 2, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(statusInfo.label, margin + 17.5, yPos, { align: 'center' })

  yPos += 15

  // ============================================
  // INFORMATIONS CLIENT
  // ============================================

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...secondaryColor)
  doc.text('FACTURÉ À', margin, yPos)
  yPos += 7

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(11)
  doc.text(invoice.client_name, margin, yPos)
  yPos += 6

  if (invoice.client_address) {
    doc.setFontSize(9)
    doc.setTextColor(...secondaryColor)
    doc.text(invoice.client_address, margin, yPos)
    yPos += 5
  }
  if (invoice.client_phone) {
    doc.text(`Tél : ${invoice.client_phone}`, margin, yPos)
    yPos += 5
  }
  if (invoice.client_email) {
    doc.text(invoice.client_email, margin, yPos)
    yPos += 5
  }

  yPos += 10

  // ============================================
  // TABLEAU DES ARTICLES
  // ============================================

  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.total),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qté', 'Prix unitaire HT', 'Total HT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  // @ts-ignore - autoTable modifie lastAutoTable
  yPos = doc.lastAutoTable.finalY + 10

  // ============================================
  // TOTAUX
  // ============================================

  const totalsX = pageWidth - margin - 70
  const totalsLabelX = totalsX - 50

  // Sous-total HT
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...secondaryColor)
  doc.text('Sous-total HT', totalsLabelX, yPos, { align: 'right' })
  doc.setTextColor(60, 60, 60)
  doc.text(formatCurrency(invoice.subtotal), totalsX, yPos, { align: 'right' })
  yPos += 7

  // TVA
  doc.setTextColor(...secondaryColor)
  doc.text(`TVA (${invoice.tax_rate}%)`, totalsLabelX, yPos, { align: 'right' })
  doc.setTextColor(60, 60, 60)
  doc.text(formatCurrency(invoice.tax_amount), totalsX, yPos, { align: 'right' })
  yPos += 10

  // Total TTC
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('Total TTC', totalsLabelX, yPos, { align: 'right' })
  doc.text(formatCurrency(invoice.total), totalsX, yPos, { align: 'right' })
  yPos += 12

  // ============================================
  // CONDITIONS DE PAIEMENT
  // ============================================

  if (invoice.payment_terms) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...secondaryColor)
    doc.text(`Conditions : ${invoice.payment_terms}`, margin, yPos)
    yPos += 6
  }

  // ============================================
  // NOTES
  // ============================================

  if (invoice.notes) {
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text('Notes :', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...secondaryColor)
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
    doc.text(splitNotes, margin, yPos)
    yPos += splitNotes.length * 5
  }

  // ============================================
  // PIED DE PAGE
  // ============================================

  const footerY = pageHeight - 20
  doc.setFontSize(8)
  doc.setTextColor(...secondaryColor)
  doc.setFont('helvetica', 'italic')
  const footerText = 'Merci de votre confiance - Facture générée par ChantiPay'
  doc.text(footerText, pageWidth / 2, footerY, { align: 'center' })

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
