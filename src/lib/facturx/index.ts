/**
 * Index du module Factur-X
 * Export des fonctions et types pour la facturation électronique EN 16931
 */

// Types
export * from './types'

// Générateur XML
export { generateFacturXML, convertToFacturXInvoice } from './generateFacturXML'

// Générateur PDF/A-3
export {
  embedFacturXInPDF,
  createFacturXPDF,
  generateFacturXOnly,
  downloadFacturXPDF,
  downloadFacturXML,
  uint8ArrayToBase64,
  type GeneratePDFA3Options,
} from './generatePDFA3'
