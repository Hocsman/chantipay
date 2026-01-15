/**
 * Types pour la génération Factur-X (EN 16931)
 */

// Profils Factur-X
export type FacturXProfile = 'MINIMUM' | 'BASIC_WL' | 'BASIC' | 'EN16931' | 'EXTENDED'

// Codes de moyens de paiement (UNTDID 4461)
export type PaymentMeansCode =
  | '10' // Espèces
  | '20' // Chèque
  | '30' // Virement
  | '48' // Carte bancaire
  | '49' // Prélèvement
  | '57' // Virement permanent
  | '58' // SEPA Credit Transfer
  | '59' // SEPA Direct Debit

// Codes de catégorie TVA (UNTDID 5305)
export type VATCategoryCode =
  | 'S' // Standard rate (taux normal)
  | 'Z' // Zero rated (taux zéro)
  | 'E' // Exempt (exonéré)
  | 'AE' // Reverse charge (autoliquidation)
  | 'K' // Intra-community (intracommunautaire)
  | 'G' // Export
  | 'O' // Non-taxable
  | 'L' // Canary Islands
  | 'M' // Ceuta/Melilla

// Codes d'unité (UN/ECE Recommendation 20)
export type UnitCode =
  | 'C62' // Unité (pièce)
  | 'H87' // Pièce
  | 'HUR' // Heure
  | 'DAY' // Jour
  | 'MTR' // Mètre
  | 'MTK' // Mètre carré
  | 'MTQ' // Mètre cube
  | 'KGM' // Kilogramme
  | 'LTR' // Litre
  | 'SET' // Ensemble/Forfait

// Interface pour les données vendeur
export interface SellerParty {
  name: string
  address?: string
  postalCode?: string
  city?: string
  countryCode: string // ISO 3166-1 alpha-2 (FR, DE, etc.)
  siret?: string
  vatNumber?: string
  email?: string
  phone?: string
}

// Interface pour les données acheteur
export interface BuyerParty {
  name: string
  address?: string
  postalCode?: string
  city?: string
  countryCode: string
  siret?: string
  vatNumber?: string
  email?: string
  phone?: string
}

// Interface pour une ligne de facture
export interface InvoiceLine {
  lineId: number
  description: string
  quantity: number
  unitCode: UnitCode
  unitPrice: number // Prix unitaire HT
  lineTotal: number // Total ligne HT
  vatRate: number // Taux TVA en %
  vatCategoryCode: VATCategoryCode
}

// Interface pour les totaux TVA par taux
export interface VATBreakdown {
  vatRate: number
  vatCategoryCode: VATCategoryCode
  taxableAmount: number // Base HT
  taxAmount: number // Montant TVA
}

// Interface pour les données de facture
export interface FacturXInvoice {
  // Identification
  invoiceNumber: string
  invoiceTypeCode: '380' | '381' | '384' | '389' // 380=Facture, 381=Avoir, 384=Facture rectificative
  issueDate: Date
  dueDate?: Date
  currencyCode: string // ISO 4217 (EUR, USD, etc.)
  buyerReference?: string // Référence commande client

  // Parties
  seller: SellerParty
  buyer: BuyerParty

  // Lignes
  lines: InvoiceLine[]

  // Totaux
  subtotal: number // Total HT
  vatBreakdowns: VATBreakdown[]
  totalVAT: number // Total TVA
  total: number // Total TTC
  dueAmount: number // Montant à payer

  // Paiement
  paymentMeansCode?: PaymentMeansCode
  paymentTerms?: string
  iban?: string
  bic?: string

  // Notes
  notes?: string
}

// Interface pour le résultat de génération
export interface FacturXResult {
  xml: string
  pdf: Uint8Array
  profile: FacturXProfile
  validationErrors?: string[]
}

// Espaces de noms XML pour Factur-X
export const XML_NAMESPACES = {
  rsm: 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
  ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
  udt: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
  qdt: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
} as const

// URN du profil EN 16931 pour Factur-X
export const FACTURX_PROFILE_URN = {
  MINIMUM: 'urn:factur-x.eu:1p0:minimum',
  BASIC_WL: 'urn:factur-x.eu:1p0:basicwl',
  BASIC: 'urn:factur-x.eu:1p0:basic',
  EN16931: 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931',
  EXTENDED: 'urn:factur-x.eu:1p0:extended',
} as const
