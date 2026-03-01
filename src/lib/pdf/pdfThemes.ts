/**
 * ===========================================
 * PDF Theme Configuration
 * ===========================================
 * Defines visual themes for PDF templates (quotes, invoices).
 * Premium templates (modern, elegant, bold) require the Team plan.
 */

export type PdfTemplateName = 'classic' | 'modern' | 'elegant' | 'bold'

export interface PdfTheme {
  name: PdfTemplateName
  label: string
  description: string
  premium: boolean
  // Colors
  accentColor: string
  accentRgb: [number, number, number]
  headerBg: string
  headerBgRgb: [number, number, number]
  headerText: string
  headerTextRgb: [number, number, number]
  tableHeaderBg: string
  tableHeaderBgRgb: [number, number, number]
  tableHeaderText: string
  tableHeaderTextRgb: [number, number, number]
  // Layout flags
  fullWidthHeader: boolean
  showAccentBar: boolean
  titleStyle: 'standard' | 'large' | 'minimal' | 'impact'
}

/**
 * Convert a hex color to RGB tuple
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return [r, g, b]
}

/**
 * Lighten a color by mixing with white
 */
export function lightenColor(rgb: [number, number, number], amount: number): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ]
}

/**
 * Get theme configuration for a template name, with optional custom accent color
 */
export function getPdfTheme(
  templateName: string | null,
  customAccentColor?: string | null
): PdfTheme {
  const name = (templateName || 'classic') as PdfTemplateName
  const baseTheme = THEMES[name] || THEMES.classic

  // Apply custom accent color if provided
  if (customAccentColor && name !== 'elegant') {
    const accentRgb = hexToRgb(customAccentColor)
    return {
      ...baseTheme,
      accentColor: customAccentColor,
      accentRgb,
    }
  }

  return baseTheme
}

/**
 * Check if a template requires premium (Team plan)
 */
export function isPremiumTemplate(templateName: string | null): boolean {
  if (!templateName || templateName === 'classic') return false
  const theme = THEMES[templateName as PdfTemplateName]
  return theme?.premium ?? false
}

const THEMES: Record<PdfTemplateName, PdfTheme> = {
  classic: {
    name: 'classic',
    label: 'Classique',
    description: 'Orange, sobre et professionnel',
    premium: false,
    accentColor: '#F97316',
    accentRgb: [249, 115, 22],
    headerBg: '#FFFFFF',
    headerBgRgb: [255, 255, 255],
    headerText: '#1F2937',
    headerTextRgb: [31, 41, 55],
    tableHeaderBg: '#1F2937',
    tableHeaderBgRgb: [31, 41, 55],
    tableHeaderText: '#FFFFFF',
    tableHeaderTextRgb: [255, 255, 255],
    fullWidthHeader: false,
    showAccentBar: true,
    titleStyle: 'standard',
  },
  modern: {
    name: 'modern',
    label: 'Moderne',
    description: 'Bleu foncé, header pleine largeur',
    premium: true,
    accentColor: '#2563EB',
    accentRgb: [37, 99, 235],
    headerBg: '#1E3A5F',
    headerBgRgb: [30, 58, 95],
    headerText: '#FFFFFF',
    headerTextRgb: [255, 255, 255],
    tableHeaderBg: '#2563EB',
    tableHeaderBgRgb: [37, 99, 235],
    tableHeaderText: '#FFFFFF',
    tableHeaderTextRgb: [255, 255, 255],
    fullWidthHeader: true,
    showAccentBar: false,
    titleStyle: 'large',
  },
  elegant: {
    name: 'elegant',
    label: 'Élégant',
    description: 'Noir et or, design minimaliste',
    premium: true,
    accentColor: '#B8860B',
    accentRgb: [184, 134, 11],
    headerBg: '#FFFFFF',
    headerBgRgb: [255, 255, 255],
    headerText: '#111827',
    headerTextRgb: [17, 24, 39],
    tableHeaderBg: '#111827',
    tableHeaderBgRgb: [17, 24, 39],
    tableHeaderText: '#FFFFFF',
    tableHeaderTextRgb: [255, 255, 255],
    fullWidthHeader: false,
    showAccentBar: true,
    titleStyle: 'minimal',
  },
  bold: {
    name: 'bold',
    label: 'Impact',
    description: 'Couleur personnalisable, style impactant',
    premium: true,
    accentColor: '#7C3AED',
    accentRgb: [124, 58, 237],
    headerBg: '#FFFFFF',
    headerBgRgb: [255, 255, 255],
    headerText: '#1F2937',
    headerTextRgb: [31, 41, 55],
    tableHeaderBg: '#7C3AED',
    tableHeaderBgRgb: [124, 58, 237],
    tableHeaderText: '#FFFFFF',
    tableHeaderTextRgb: [255, 255, 255],
    fullWidthHeader: false,
    showAccentBar: true,
    titleStyle: 'impact',
  },
}

export { THEMES }
