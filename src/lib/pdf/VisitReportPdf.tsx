import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { VisitReportResult } from '@/types/visit-report'

export interface VisitReportPdfProps {
  report: VisitReportResult
  photos: string[]
  metadata?: {
    clientName?: string
    location?: string
    visitDate?: string
    trade?: string
    context?: string
  }
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#0EA5E9',
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 10,
    color: '#475569',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0EA5E9',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  text: {
    color: '#0F172A',
    lineHeight: 1.4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listBullet: {
    marginRight: 6,
    color: '#0EA5E9',
  },
  badge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 6,
    alignSelf: 'flex-start',
  },
  badgeHigh: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  badgeMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeLow: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  photoBlock: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 4,
    objectFit: 'cover',
    marginBottom: 6,
  },
  photoTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  metaLine: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
})

function severityStyle(severity: string | undefined) {
  if (severity === 'high') return styles.badgeHigh
  if (severity === 'medium') return styles.badgeMedium
  return styles.badgeLow
}

export function VisitReportPdfDocument({ report, photos, metadata }: VisitReportPdfProps) {
  const photoAnnotations = report.photoAnnotations || []

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de visite technique</Text>
          {metadata?.clientName && <Text style={styles.subtitle}>Client: {metadata.clientName}</Text>}
          {metadata?.location && <Text style={styles.subtitle}>Lieu: {metadata.location}</Text>}
          {metadata?.visitDate && <Text style={styles.subtitle}>Date: {metadata.visitDate}</Text>}
          {metadata?.trade && <Text style={styles.subtitle}>Métier: {metadata.trade}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <Text style={styles.text}>{report.summary}</Text>
        </View>

        {metadata?.context && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes utilisateur</Text>
            <Text style={styles.text}>{metadata.context}</Text>
          </View>
        )}

        {report.diagnostics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnostics</Text>
            {report.diagnostics.map((item, index) => (
              <View key={`diag-${index}`} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {report.nonConformities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Non-conformités</Text>
            {report.nonConformities.map((item, index) => (
              <View key={`nc-${index}`} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.text}>{item.title}</Text>
                  <Text style={[styles.badge, severityStyle(item.severity)]}>
                    {item.severity?.toUpperCase() || 'MEDIUM'}
                  </Text>
                </View>
                {item.reference && <Text style={styles.metaLine}>Référence: {item.reference}</Text>}
                {item.recommendation && (
                  <Text style={styles.metaLine}>Recommandation: {item.recommendation}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {report.recommendations && report.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommandations</Text>
            {report.recommendations.map((item, index) => (
              <View key={`rec-${index}`} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.text}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos annotées</Text>
            {photos.map((photo, index) => {
              const annotation = photoAnnotations.find((entry) => entry.index === index)
              return (
                <View key={`photo-${index}`} style={styles.photoBlock} wrap={false}>
                  <Image src={photo} style={styles.photo} />
                  <Text style={styles.photoTitle}>
                    {annotation?.title || `Photo ${index + 1}`}
                  </Text>
                  {annotation?.annotations?.length ? (
                    annotation.annotations.map((item, noteIndex) => (
                      <View key={`photo-${index}-note-${noteIndex}`} style={styles.listItem}>
                        <Text style={styles.listBullet}>•</Text>
                        <Text style={styles.text}>{item}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.metaLine}>Aucune annotation disponible.</Text>
                  )}
                  {annotation?.notes && (
                    <Text style={styles.metaLine}>Notes: {annotation.notes}</Text>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </Page>
    </Document>
  )
}
