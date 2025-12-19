/**
 * ===========================================
 * Quote PDF Template Component
 * ===========================================
 * Professional PDF template for artisan quotes using @react-pdf/renderer.
 * Renders a clean A4 document with all quote details.
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { Profile, Client, Quote, QuoteItem, Settings } from '@/types/database'

// ============================================
// Types
// ============================================

export interface QuotePdfProps {
  quote: Quote
  quoteItems: QuoteItem[]
  client: Client
  profile: Profile | null
  settings: Settings | null
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 2,
  },
  logo: {
    width: 80,
    height: 40,
    marginBottom: 8,
    objectFit: 'contain',
  },
  documentTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  documentInfo: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 3,
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },

  // Client section
  clientSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
  },

  // Table styles
  table: {
    marginBottom: 25,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E3A8A',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  // Column widths
  colDescription: { flex: 3 },
  colQty: { flex: 0.7, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colVat: { flex: 0.7, textAlign: 'center' },
  colTotal: { flex: 1.2, textAlign: 'right' },

  // Totals section
  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 250,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 10,
    color: '#334155',
    fontFamily: 'Helvetica-Bold',
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#2563EB',
  },
  totalTTCLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
  },
  totalTTCValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  depositLabel: {
    fontSize: 10,
    color: '#059669',
  },
  depositValue: {
    fontSize: 10,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },

  // Signature section
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signatureBox: {
    width: 200,
    alignItems: 'center',
  },
  signatureTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  signatureImage: {
    width: 150,
    height: 60,
    objectFit: 'contain',
    marginBottom: 8,
  },
  signaturePlaceholder: {
    width: 180,
    height: 60,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 4,
    marginBottom: 8,
  },
  signatureDate: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },

  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
    marginBottom: 3,
  },
  footerBrand: {
    fontSize: 7,
    color: '#CBD5E1',
    marginTop: 5,
  },
})

// ============================================
// Helper functions
// ============================================

/**
 * Format a number as currency (EUR)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a date to French locale
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Get status label and color
 */
function getStatusInfo(status: Quote['status']): { label: string; bgColor: string; textColor: string } {
  const statusMap: Record<Quote['status'], { label: string; bgColor: string; textColor: string }> = {
    draft: { label: 'Brouillon', bgColor: '#F1F5F9', textColor: '#64748B' },
    sent: { label: 'Envoyé', bgColor: '#DBEAFE', textColor: '#1D4ED8' },
    signed: { label: 'Signé', bgColor: '#D1FAE5', textColor: '#059669' },
    deposit_paid: { label: 'Acompte payé', bgColor: '#D1FAE5', textColor: '#059669' },
    completed: { label: 'Terminé', bgColor: '#D1FAE5', textColor: '#059669' },
    canceled: { label: 'Annulé', bgColor: '#FEE2E2', textColor: '#DC2626' },
  }
  return statusMap[status] || statusMap.draft
}

// ============================================
// PDF Document Component
// ============================================

export const QuotePdfDocument = ({
  quote,
  quoteItems,
  client,
  profile,
  settings,
}: QuotePdfProps) => {
  // Calculate totals
  const totalHT = quoteItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price_ht,
    0
  )
  
  // Calculate VAT per item then sum (supports per-line VAT rates)
  const totalVAT = quoteItems.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price_ht * item.vat_rate) / 100,
    0
  )
  
  const totalTTC = totalHT + totalVAT
  const statusInfo = getStatusInfo(quote.status)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ============================================ */}
        {/* Header */}
        {/* ============================================ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Company Logo (if available) */}
            {settings?.company_logo_url && (
              <Image src={settings.company_logo_url} style={styles.logo} />
            )}
            {/* Company Name */}
            <Text style={styles.companyName}>
              {profile?.company_name || 'Mon Entreprise'}
            </Text>
            {/* Company Contact Info */}
            {profile?.email && (
              <Text style={styles.companyInfo}>{profile.email}</Text>
            )}
            {profile?.phone && (
              <Text style={styles.companyInfo}>{profile.phone}</Text>
            )}
            {profile?.address && (
              <Text style={styles.companyInfo}>{profile.address}</Text>
            )}
            {/* SIRET number */}
            {(profile as Profile & { siret?: string | null })?.siret && (
              <Text style={styles.companyInfo}>
                SIRET : {(profile as Profile & { siret?: string | null }).siret}
              </Text>
            )}
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.documentTitle}>DEVIS</Text>
            <Text style={styles.documentInfo}>
              N° {quote.quote_number}
            </Text>
            <Text style={styles.documentInfo}>
              Date : {formatDate(quote.created_at)}
            </Text>
            {quote.expires_at && (
              <Text style={styles.documentInfo}>
                Valide jusqu&apos;au : {formatDate(quote.expires_at)}
              </Text>
            )}
            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.bgColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================ */}
        {/* Client Section */}
        {/* ============================================ */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.address_line1 && (
            <Text style={styles.clientInfo}>{client.address_line1}</Text>
          )}
          {(client.postal_code || client.city) && (
            <Text style={styles.clientInfo}>
              {[client.postal_code, client.city].filter(Boolean).join(' ')}
            </Text>
          )}
          {client.email && (
            <Text style={styles.clientInfo}>{client.email}</Text>
          )}
          {client.phone && (
            <Text style={styles.clientInfo}>Tél : {client.phone}</Text>
          )}
        </View>

        {/* ============================================ */}
        {/* Items Table */}
        {/* ============================================ */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>PU HT</Text>
            <Text style={[styles.tableHeaderText, styles.colVat]}>TVA</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>

          {/* Table Rows */}
          {quoteItems
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item, index) => {
              const lineTotal = item.quantity * item.unit_price_ht
              return (
                <View
                  key={item.id}
                  style={
                    index % 2 === 1
                      ? [styles.tableRow, styles.tableRowAlt]
                      : styles.tableRow
                  }
                >
                  <Text style={[styles.tableCell, styles.colDescription]}>
                    {item.description}
                  </Text>
                  <Text style={[styles.tableCell, styles.colQty]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>
                    {formatCurrency(item.unit_price_ht)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colVat]}>
                    {item.vat_rate}%
                  </Text>
                  <Text style={[styles.tableCell, styles.colTotal]}>
                    {formatCurrency(lineTotal)}
                  </Text>
                </View>
              )
            })}
        </View>

        {/* ============================================ */}
        {/* Totals Section */}
        {/* ============================================ */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalHT)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalVAT)}</Text>
            </View>
            <View style={styles.totalTTCRow}>
              <Text style={styles.totalTTCLabel}>Total TTC</Text>
              <Text style={styles.totalTTCValue}>{formatCurrency(totalTTC)}</Text>
            </View>

            {/* Deposit Info */}
            {quote.deposit_amount && quote.deposit_amount > 0 && (
              <View style={styles.depositRow}>
                <Text style={styles.depositLabel}>
                  {quote.deposit_status === 'paid'
                    ? 'Acompte encaissé'
                    : 'Acompte demandé'}
                </Text>
                <Text style={styles.depositValue}>
                  {formatCurrency(quote.deposit_amount)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ============================================ */}
        {/* Signature Section */}
        {/* ============================================ */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>Signature client</Text>
              {quote.signature_image_url ? (
                <>
                  <Image
                    src={quote.signature_image_url}
                    style={styles.signatureImage}
                  />
                  {quote.signed_at && (
                    <Text style={styles.signatureDate}>
                      Signé le {formatDate(quote.signed_at)}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.signaturePlaceholder} />
                  <Text style={styles.signatureDate}>
                    En attente de signature
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* ============================================ */}
        {/* Footer */}
        {/* ============================================ */}
        <View style={styles.footer} fixed>
          {settings?.pdf_footer_text && (
            <Text style={styles.footerText}>{settings.pdf_footer_text}</Text>
          )}
          <Text style={styles.footerBrand}>
            Devis généré via ChantiPay • www.chantipay.com
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export default QuotePdfDocument
