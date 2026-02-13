/**
 * ===========================================
 * Invoice PDF Generation - Server Side
 * ===========================================
 * Génération de PDF de facture côté serveur avec @react-pdf/renderer
 * Utilisé par l'API /api/invoices/[id]/send-email
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Types
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
}

interface InvoicePdfProps {
  invoice: Invoice
  companyInfo: CompanyInfo
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  companyInfo: {
    alignItems: 'flex-end',
    maxWidth: 250,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'right',
  },
  companyDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
    maxWidth: 250,
  },
  companyAddress: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'right',
    maxWidth: 250,
    lineHeight: 1.4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  detailsBox: {
    width: '48%',
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  detailsText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#6B7280',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
    fontSize: 9,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 30,
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 25,
    fontSize: 10,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 3,
    borderTopColor: '#F97316',
  },
  totalFinalLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 25,
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalFinalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F97316',
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  depositLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 25,
    fontSize: 11,
    color: '#16A34A', // green-600
  },
  depositValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
    color: '#16A34A',
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#EA580C', // orange-600
  },
  remainingLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 25,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  remainingValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#92400E',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
  },
  statusBadge: {
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusSent: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  statusDraft: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
})

// Composant PDF
export const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({
  invoice,
  companyInfo,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    // Utiliser un espace normal au lieu de l'espace insécable de Intl.NumberFormat
    // qui cause des problèmes d'affichage dans react-pdf (slash au lieu d'espace)
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
    // Remplacer les espaces insécables par des espaces normaux
    return formatted.replace(/\u00A0/g, ' ') + ' €'
  }

  const formatPercent = (rate: number) => {
    // Formater le taux de TVA correctement
    return rate % 1 === 0 ? `${rate}` : rate.toFixed(2).replace('.', ',')
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Payée'
      case 'sent':
        return 'Envoyée'
      case 'draft':
        return 'Brouillon'
      case 'overdue':
        return 'En retard'
      default:
        return status
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return styles.statusPaid
      case 'sent':
        return styles.statusSent
      case 'overdue':
        return styles.statusOverdue
      default:
        return styles.statusDraft
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {companyInfo.name}
            </Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            {companyInfo.address && (
              <Text style={styles.companyAddress}>{companyInfo.address}</Text>
            )}
            {companyInfo.phone && (
              <Text style={styles.companyDetail}>{companyInfo.phone}</Text>
            )}
            {companyInfo.email && (
              <Text style={styles.companyDetail}>{companyInfo.email}</Text>
            )}
            {companyInfo.siret && (
              <Text style={styles.companyDetail}>
                SIRET: {companyInfo.siret}
              </Text>
            )}
          </View>
        </View>

        {/* Titre */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.title}>FACTURE</Text>
          <View style={[styles.statusBadge, getStatusStyle(invoice.payment_status)]}>
            <Text>{getStatusLabel(invoice.payment_status)}</Text>
          </View>
        </View>

        {/* Détails facture et client */}
        <View style={styles.invoiceDetails}>
          <View style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>Facture à :</Text>
            <Text style={[styles.detailsText, { fontWeight: 'bold', color: '#374151' }]}>
              {invoice.client_name}
            </Text>
            {invoice.client_address && (
              <Text style={styles.detailsText}>{invoice.client_address}</Text>
            )}
            {invoice.client_email && (
              <Text style={styles.detailsText}>{invoice.client_email}</Text>
            )}
            {invoice.client_phone && (
              <Text style={styles.detailsText}>{invoice.client_phone}</Text>
            )}
          </View>

          <View style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>Informations :</Text>
            <Text style={styles.detailsText}>
              N° {invoice.invoice_number}
            </Text>
            <Text style={styles.detailsText}>
              Émise le {formatDate(invoice.issue_date)}
            </Text>
            {invoice.due_date && (
              <Text style={styles.detailsText}>
                Échéance : {formatDate(invoice.due_date)}
              </Text>
            )}
          </View>
        </View>

        {/* Tableau des items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qté</Text>
            <Text style={styles.col3}>Prix unit. HT</Text>
            <Text style={styles.col4}>Total HT</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT :</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              TVA ({formatPercent(invoice.tax_rate)} %) :
            </Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.tax_amount)}
            </Text>
          </View>

          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Total TTC :</Text>
            <Text style={styles.totalFinalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>

          {/* Acompte déjà versé */}
          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <>
              <View style={styles.depositRow}>
                <Text style={styles.depositLabel}>Acompte versé :</Text>
                <Text style={styles.depositValue}>
                  - {formatCurrency(invoice.paid_amount)}
                </Text>
              </View>

              <View style={styles.remainingRow}>
                <Text style={styles.remainingLabel}>RESTE À PAYER :</Text>
                <Text style={styles.remainingValue}>
                  {formatCurrency(invoice.total - invoice.paid_amount)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Conditions de paiement */}
        {invoice.payment_terms && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Conditions de paiement</Text>
            <Text style={styles.paymentText}>{invoice.payment_terms}</Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes :</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Pied de page */}
        <Text style={styles.footer}>
          Merci de votre confiance - Facture générée par ChantiPay
        </Text>
      </Page>
    </Document>
  )
}
