/**
 * Générateur XML Factur-X conforme EN 16931
 * Norme européenne de facturation électronique
 */

import { create } from 'xmlbuilder2'
import {
  FacturXInvoice,
  XML_NAMESPACES,
  FACTURX_PROFILE_URN,
  FacturXProfile,
  VATCategoryCode,
} from './types'

/**
 * Formater une date au format YYYYMMDD (format 102)
 */
function formatDate102(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Formater un montant avec 2 décimales
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Déterminer le code de catégorie TVA à partir du taux
 */
function getVATCategoryCode(vatRate: number): VATCategoryCode {
  if (vatRate === 0) return 'Z'
  return 'S' // Standard rate pour tous les taux > 0
}

/**
 * Générer le XML Factur-X conforme EN 16931
 */
export function generateFacturXML(
  invoice: FacturXInvoice,
  profile: FacturXProfile = 'EN16931'
): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })

  const root = doc.ele(XML_NAMESPACES.rsm, 'rsm:CrossIndustryInvoice')
  root.att('xmlns:rsm', XML_NAMESPACES.rsm)
  root.att('xmlns:ram', XML_NAMESPACES.ram)
  root.att('xmlns:udt', XML_NAMESPACES.udt)
  root.att('xmlns:qdt', XML_NAMESPACES.qdt)

  // ============================================
  // ExchangedDocumentContext - Contexte du document
  // ============================================
  const context = root.ele('rsm:ExchangedDocumentContext')
  const guideline = context.ele('ram:GuidelineSpecifiedDocumentContextParameter')
  guideline.ele('ram:ID').txt(FACTURX_PROFILE_URN[profile])

  // ============================================
  // ExchangedDocument - Informations document
  // ============================================
  const exchangedDoc = root.ele('rsm:ExchangedDocument')
  exchangedDoc.ele('ram:ID').txt(invoice.invoiceNumber)
  exchangedDoc.ele('ram:TypeCode').txt(invoice.invoiceTypeCode)

  // Date d'émission
  const issueDateTime = exchangedDoc.ele('ram:IssueDateTime')
  issueDateTime.ele('udt:DateTimeString').att('format', '102').txt(formatDate102(invoice.issueDate))

  // Notes (si présentes)
  if (invoice.notes) {
    const note = exchangedDoc.ele('ram:IncludedNote')
    note.ele('ram:Content').txt(invoice.notes)
  }

  // ============================================
  // SupplyChainTradeTransaction - Transaction commerciale
  // ============================================
  const transaction = root.ele('rsm:SupplyChainTradeTransaction')

  // Lignes de facture
  for (const line of invoice.lines) {
    const lineItem = transaction.ele('ram:IncludedSupplyChainTradeLineItem')

    // Document de ligne
    const lineDoc = lineItem.ele('ram:AssociatedDocumentLineDocument')
    lineDoc.ele('ram:LineID').txt(String(line.lineId))

    // Produit/Service
    const product = lineItem.ele('ram:SpecifiedTradeProduct')
    product.ele('ram:Name').txt(line.description)

    // Accord commercial de ligne
    const lineAgreement = lineItem.ele('ram:SpecifiedLineTradeAgreement')
    const netPrice = lineAgreement.ele('ram:NetPriceProductTradePrice')
    netPrice.ele('ram:ChargeAmount').txt(formatAmount(line.unitPrice))

    // Livraison de ligne
    const lineDelivery = lineItem.ele('ram:SpecifiedLineTradeDelivery')
    lineDelivery
      .ele('ram:BilledQuantity')
      .att('unitCode', line.unitCode)
      .txt(String(line.quantity))

    // Règlement de ligne
    const lineSettlement = lineItem.ele('ram:SpecifiedLineTradeSettlement')

    // TVA applicable à la ligne
    const lineTax = lineSettlement.ele('ram:ApplicableTradeTax')
    lineTax.ele('ram:TypeCode').txt('VAT')
    lineTax.ele('ram:CategoryCode').txt(line.vatCategoryCode)
    lineTax.ele('ram:RateApplicablePercent').txt(formatAmount(line.vatRate))

    // Total de la ligne
    const lineSum = lineSettlement.ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
    lineSum.ele('ram:LineTotalAmount').txt(formatAmount(line.lineTotal))
  }

  // ============================================
  // ApplicableHeaderTradeAgreement - Accord commercial
  // ============================================
  const agreement = transaction.ele('ram:ApplicableHeaderTradeAgreement')

  // Référence acheteur (n° commande)
  if (invoice.buyerReference) {
    agreement.ele('ram:BuyerReference').txt(invoice.buyerReference)
  }

  // Vendeur
  const seller = agreement.ele('ram:SellerTradeParty')
  seller.ele('ram:Name').txt(invoice.seller.name)

  // Organisation légale du vendeur (SIRET)
  if (invoice.seller.siret) {
    const sellerLegal = seller.ele('ram:SpecifiedLegalOrganization')
    sellerLegal.ele('ram:ID').att('schemeID', '0002').txt(invoice.seller.siret)
  }

  // Adresse du vendeur
  if (invoice.seller.address || invoice.seller.city) {
    const sellerAddress = seller.ele('ram:PostalTradeAddress')
    if (invoice.seller.postalCode) {
      sellerAddress.ele('ram:PostcodeCode').txt(invoice.seller.postalCode)
    }
    if (invoice.seller.address) {
      sellerAddress.ele('ram:LineOne').txt(invoice.seller.address)
    }
    if (invoice.seller.city) {
      sellerAddress.ele('ram:CityName').txt(invoice.seller.city)
    }
    sellerAddress.ele('ram:CountryID').txt(invoice.seller.countryCode)
  }

  // Email du vendeur
  if (invoice.seller.email) {
    const sellerContact = seller.ele('ram:URIUniversalCommunication')
    sellerContact.ele('ram:URIID').att('schemeID', 'EM').txt(invoice.seller.email)
  }

  // TVA intracommunautaire du vendeur
  if (invoice.seller.vatNumber) {
    const sellerTaxReg = seller.ele('ram:SpecifiedTaxRegistration')
    sellerTaxReg.ele('ram:ID').att('schemeID', 'VA').txt(invoice.seller.vatNumber)
  }

  // Acheteur
  const buyer = agreement.ele('ram:BuyerTradeParty')
  buyer.ele('ram:Name').txt(invoice.buyer.name)

  // Organisation légale de l'acheteur (SIRET)
  if (invoice.buyer.siret) {
    const buyerLegal = buyer.ele('ram:SpecifiedLegalOrganization')
    buyerLegal.ele('ram:ID').att('schemeID', '0002').txt(invoice.buyer.siret)
  }

  // Adresse de l'acheteur
  if (invoice.buyer.address || invoice.buyer.city) {
    const buyerAddress = buyer.ele('ram:PostalTradeAddress')
    if (invoice.buyer.postalCode) {
      buyerAddress.ele('ram:PostcodeCode').txt(invoice.buyer.postalCode)
    }
    if (invoice.buyer.address) {
      buyerAddress.ele('ram:LineOne').txt(invoice.buyer.address)
    }
    if (invoice.buyer.city) {
      buyerAddress.ele('ram:CityName').txt(invoice.buyer.city)
    }
    buyerAddress.ele('ram:CountryID').txt(invoice.buyer.countryCode)
  }

  // Email de l'acheteur
  if (invoice.buyer.email) {
    const buyerContact = buyer.ele('ram:URIUniversalCommunication')
    buyerContact.ele('ram:URIID').att('schemeID', 'EM').txt(invoice.buyer.email)
  }

  // ============================================
  // ApplicableHeaderTradeDelivery - Livraison (optionnel)
  // ============================================
  transaction.ele('ram:ApplicableHeaderTradeDelivery')

  // ============================================
  // ApplicableHeaderTradeSettlement - Règlement
  // ============================================
  const settlement = transaction.ele('ram:ApplicableHeaderTradeSettlement')

  // Code devise
  settlement.ele('ram:InvoiceCurrencyCode').txt(invoice.currencyCode)

  // Moyens de paiement
  if (invoice.paymentMeansCode) {
    const paymentMeans = settlement.ele('ram:SpecifiedTradeSettlementPaymentMeans')
    paymentMeans.ele('ram:TypeCode').txt(invoice.paymentMeansCode)

    // Coordonnées bancaires (pour virement)
    if (invoice.iban && (invoice.paymentMeansCode === '30' || invoice.paymentMeansCode === '58')) {
      const account = paymentMeans.ele('ram:PayeePartyCreditorFinancialAccount')
      account.ele('ram:IBANID').txt(invoice.iban)
      if (invoice.bic) {
        const institution = paymentMeans.ele('ram:PayeeSpecifiedCreditorFinancialInstitution')
        institution.ele('ram:BICID').txt(invoice.bic)
      }
    }
  }

  // Récapitulatif TVA par taux
  for (const vat of invoice.vatBreakdowns) {
    const tax = settlement.ele('ram:ApplicableTradeTax')
    tax.ele('ram:CalculatedAmount').txt(formatAmount(vat.taxAmount))
    tax.ele('ram:TypeCode').txt('VAT')
    tax.ele('ram:BasisAmount').txt(formatAmount(vat.taxableAmount))
    tax.ele('ram:CategoryCode').txt(vat.vatCategoryCode)
    tax.ele('ram:RateApplicablePercent').txt(formatAmount(vat.vatRate))
  }

  // Conditions de paiement
  if (invoice.paymentTerms || invoice.dueDate) {
    const paymentTerms = settlement.ele('ram:SpecifiedTradePaymentTerms')
    if (invoice.paymentTerms) {
      paymentTerms.ele('ram:Description').txt(invoice.paymentTerms)
    }
    if (invoice.dueDate) {
      const dueDateTime = paymentTerms.ele('ram:DueDateDateTime')
      dueDateTime.ele('udt:DateTimeString').att('format', '102').txt(formatDate102(invoice.dueDate))
    }
  }

  // Totaux monétaires
  const monetarySum = settlement.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
  monetarySum.ele('ram:LineTotalAmount').txt(formatAmount(invoice.subtotal))
  monetarySum.ele('ram:TaxBasisTotalAmount').txt(formatAmount(invoice.subtotal))
  monetarySum
    .ele('ram:TaxTotalAmount')
    .att('currencyID', invoice.currencyCode)
    .txt(formatAmount(invoice.totalVAT))
  monetarySum.ele('ram:GrandTotalAmount').txt(formatAmount(invoice.total))
  monetarySum.ele('ram:DuePayableAmount').txt(formatAmount(invoice.dueAmount))

  // Générer le XML avec indentation
  return doc.end({ prettyPrint: true })
}

/**
 * Convertir une facture ChantiPay vers le format FacturXInvoice
 */
export function convertToFacturXInvoice(
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
  }
): FacturXInvoice {
  // Construire les lignes de facture
  const lines = invoice.items.map((item, index) => {
    const vatRate = item.vat_rate ?? invoice.tax_rate
    return {
      lineId: index + 1,
      description: item.description,
      quantity: item.quantity,
      unitCode: 'C62' as const, // Unité par défaut
      unitPrice: item.unit_price,
      lineTotal: item.total,
      vatRate: vatRate,
      vatCategoryCode: getVATCategoryCode(vatRate),
    }
  })

  // Calculer les récapitulatifs TVA par taux
  const vatMap = new Map<number, { taxable: number; tax: number }>()
  for (const item of invoice.items) {
    const rate = item.vat_rate ?? invoice.tax_rate
    const current = vatMap.get(rate) || { taxable: 0, tax: 0 }
    current.taxable += item.total
    current.tax += item.total * (rate / 100)
    vatMap.set(rate, current)
  }

  const vatBreakdowns = Array.from(vatMap.entries()).map(([rate, amounts]) => ({
    vatRate: rate,
    vatCategoryCode: getVATCategoryCode(rate),
    taxableAmount: amounts.taxable,
    taxAmount: amounts.tax,
  }))

  // Parser l'adresse pour extraire ville et code postal
  const parseAddress = (address?: string | null) => {
    if (!address) return { line: undefined, postalCode: undefined, city: undefined }
    // Format attendu: "10 rue Example, 75001 Paris" ou "10 rue Example 75001 Paris"
    const match = address.match(/^(.+?)\s*,?\s*(\d{5})\s+(.+)$/)
    if (match) {
      return { line: match[1], postalCode: match[2], city: match[3] }
    }
    return { line: address, postalCode: undefined, city: undefined }
  }

  const sellerAddr = parseAddress(seller.address)
  const buyerAddr = parseAddress(buyer?.address || invoice.client_address)

  return {
    invoiceNumber: invoice.invoice_number,
    invoiceTypeCode: '380', // Facture commerciale
    issueDate: new Date(invoice.issue_date),
    dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
    currencyCode: 'EUR',

    seller: {
      name: seller.company_name || seller.full_name || 'Entreprise',
      address: sellerAddr.line,
      postalCode: sellerAddr.postalCode,
      city: sellerAddr.city,
      countryCode: 'FR',
      siret: seller.siret || undefined,
      vatNumber: seller.vat_number || undefined,
      email: seller.email || undefined,
      phone: seller.phone || undefined,
    },

    buyer: {
      name: buyer?.name || invoice.client_name,
      address: buyerAddr.line,
      postalCode: buyerAddr.postalCode,
      city: buyerAddr.city,
      countryCode: 'FR',
      siret: buyer?.siret || undefined,
      vatNumber: buyer?.vat_number || undefined,
      email: buyer?.email || invoice.client_email || undefined,
      phone: buyer?.phone || invoice.client_phone || undefined,
    },

    lines,
    subtotal: invoice.subtotal,
    vatBreakdowns,
    totalVAT: invoice.tax_amount,
    total: invoice.total,
    dueAmount: invoice.total,

    paymentMeansCode: '30', // Virement par défaut
    paymentTerms: invoice.payment_terms || undefined,
    notes: invoice.notes || undefined,
  }
}
