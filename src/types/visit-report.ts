export type VisitReportSeverity = 'low' | 'medium' | 'high'

export interface VisitReportNonConformity {
  title: string
  severity: VisitReportSeverity
  reference?: string
  recommendation?: string
}

export interface VisitReportPhotoAnnotation {
  index: number
  title?: string
  annotations: string[]
  notes?: string
}

export interface VisitReportResult {
  summary: string
  diagnostics: string[]
  nonConformities: VisitReportNonConformity[]
  photoAnnotations: VisitReportPhotoAnnotation[]
  recommendations?: string[]
}

export interface GenerateVisitReportRequest {
  photos: string[]
  trade?: string
  context?: string
  clientName?: string
  location?: string
  visitDate?: string
}

export interface GenerateVisitReportResponse extends VisitReportResult {
  photos: string[]
}
