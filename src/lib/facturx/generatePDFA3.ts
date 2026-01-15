/**
 * Générateur PDF/A-3 avec XML Factur-X embarqué
 * Conforme à la norme EN 16931 pour la facturation électronique
 */

import { PDFDocument, PDFName, PDFHexString, PDFString, PDFArray, PDFDict } from 'pdf-lib'
import { generateFacturXML, convertToFacturXInvoice } from './generateFacturXML'
import { FacturXProfile } from './types'

/**
 * Constantes pour le PDF/A-3
 */
const FACTURX_FILENAME = 'factur-x.xml'
const FACTURX_RELATIONSHIP = 'Data' // Alternative, Data, Source selon le profil
const FACTURX_DESCRIPTION = 'Factur-X XML invoice'

/**
 * Options pour la génération du PDF/A-3
 */
export interface GeneratePDFA3Options {
  profile?: FacturXProfile
  existingPdfBytes?: Uint8Array
}

/**
 * Embarquer le XML Factur-X dans un PDF existant pour créer un PDF/A-3
 * 
 * Note: Cette implémentation simplifié crée un PDF avec le XML embarqué.
 * Pour une conformité PDF/A-3 complète, un validateur PDF/A externe est recommandé.
 */
export async function embedFacturXInPDF(
  pdfBytes: Uint8Array,
  invoice: {
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
    payment_terms?: string | null
    notes?: string | null
    items: Array<{
      description: string
      quantity: number
      unit_price: number
      total: number
      vat_rate?: number
    }>
  },
  seller: {
    company_name?: string | null
    full_name?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  buyer?: {
    name?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  options: GeneratePDFA3Options = {}
): Promise<Uint8Array> {
  const { profile = 'EN16931' } = options

  // Charger le PDF existant
  const pdfDoc = await PDFDocument.load(pdfBytes, {
    updateMetadata: false,
  })

  // Convertir la facture au format Factur-X
  const facturxInvoice = convertToFacturXInvoice(invoice, seller, buyer)

  // Générer le XML
  const xmlContent = generateFacturXML(facturxInvoice, profile)
  const xmlBytes = new TextEncoder().encode(xmlContent)

  // Embarquer le fichier XML comme pièce jointe
  await pdfDoc.attach(xmlBytes, FACTURX_FILENAME, {
    mimeType: 'text/xml',
    description: FACTURX_DESCRIPTION,
    creationDate: new Date(),
    modificationDate: new Date(),
  })

  // Mettre à jour les métadonnées du PDF
  pdfDoc.setTitle(`Facture ${invoice.invoice_number}`)
  pdfDoc.setSubject('Facture électronique Factur-X')
  pdfDoc.setKeywords(['facture', 'factur-x', 'en16931', invoice.invoice_number])
  pdfDoc.setProducer('ChantiPay - Factur-X Generator')
  pdfDoc.setCreator('ChantiPay')
  pdfDoc.setCreationDate(new Date())
  pdfDoc.setModificationDate(new Date())

  // Ajouter les métadonnées XMP pour PDF/A-3
  // Note: pdf-lib ne supporte pas nativement les XMP complets pour PDF/A-3
  // Pour une conformité totale, utiliser une bibliothèque spécialisée côté serveur

  // Sauvegarder le PDF modifié
  const modifiedPdfBytes = await pdfDoc.save()

  return modifiedPdfBytes
}

/**
 * Créer un nouveau PDF/A-3 avec le XML Factur-X embarqué
 * à partir d'un PDF de base généré par jsPDF
 */
export async function createFacturXPDF(
  basePdfBase64: string,
  invoice: {
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
    payment_terms?: string | null
    notes?: string | null
    items: Array<{
      description: string
      quantity: number
      unit_price: number
      total: number
      vat_rate?: number
    }>
  },
  seller: {
    company_name?: string | null
    full_name?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  buyer?: {
    name?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  options: GeneratePDFA3Options = {}
): Promise<{ pdfBytes: Uint8Array; xmlContent: string }> {
  const { profile = 'EN16931' } = options

  // Décoder le PDF base64
  const pdfBytes = base64ToUint8Array(basePdfBase64)

  // Générer le XML Factur-X
  const facturxInvoice = convertToFacturXInvoice(invoice, seller, buyer)
  const xmlContent = generateFacturXML(facturxInvoice, profile)

  // Embarquer le XML dans le PDF
  const resultPdfBytes = await embedFacturXInPDF(pdfBytes, invoice, seller, buyer, options)

  return {
    pdfBytes: resultPdfBytes,
    xmlContent,
  }
}

/**
 * Générer uniquement le XML Factur-X (sans PDF)
 * Utile pour l'intégration avec des systèmes tiers
 */
export function generateFacturXOnly(
  invoice: {
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
    payment_terms?: string | null
    notes?: string | null
    items: Array<{
      description: string
      quantity: number
      unit_price: number
      total: number
      vat_rate?: number
    }>
  },
  seller: {
    company_name?: string | null
    full_name?: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  buyer?: {
    name?: string | null
    address?: string | null
    email?: string | null
    phone?: string | null
    siret?: string | null
    vat_number?: string | null
  },
  profile: FacturXProfile = 'EN16931'
): string {
  const facturxInvoice = convertToFacturXInvoice(invoice, seller, buyer)
  return generateFacturXML(facturxInvoice, profile)
}

/**
 * Utilitaires de conversion
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // Supprimer le préfixe data URL si présent
  const base64Data = base64.replace(/^data:application\/pdf;base64,/, '')
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Télécharger le PDF Factur-X côté client
 */
export function downloadFacturXPDF(
  pdfBytes: Uint8Array,
  invoiceNumber: string
): void {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facture-${invoiceNumber}-facturx.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Télécharger uniquement le XML Factur-X côté client
 */
export function downloadFacturXML(
  xmlContent: string,
  invoiceNumber: string
): void {
  const blob = new Blob([xmlContent], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facture-${invoiceNumber}-facturx.xml`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
