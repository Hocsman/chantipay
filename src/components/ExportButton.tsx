'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  /** Type de document à exporter */
  type: 'quotes' | 'invoices'
  /** ID spécifique (pour export d'un seul document) */
  documentId?: string
  /** Filtres à appliquer (pour export de liste) */
  filters?: {
    status?: string
    from?: string
    to?: string
  }
  /** Variante du bouton */
  variant?: 'default' | 'outline' | 'ghost'
  /** Taille du bouton */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Afficher uniquement l'icône */
  iconOnly?: boolean
  /** Classes CSS additionnelles */
  className?: string
}

export function ExportButton({
  type,
  documentId,
  filters,
  variant = 'outline',
  size = 'sm',
  iconOnly = false,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'excel' | 'pdf', includeItems = false) => {
    setIsExporting(true)

    try {
      // Construire l'URL
      let url: string
      if (documentId) {
        // Export d'un seul document
        url = `/api/${type}/${documentId}/export`
      } else {
        // Export de la liste
        url = `/api/${type}/export`
        const params = new URLSearchParams()
        if (includeItems) params.set('includeItems', 'true')
        if (filters?.status) params.set('status', filters.status)
        if (filters?.from) params.set('from', filters.from)
        if (filters?.to) params.set('to', filters.to)
        if (params.toString()) url += `?${params.toString()}`
      }

      // Pour PDF, rediriger vers la route PDF existante
      if (format === 'pdf' && documentId) {
        url = `/api/${type}/${documentId}/pdf`
      }

      const response = await fetch(url)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de l\'export')
      }

      // Télécharger le fichier
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `export.${format === 'excel' ? 'xlsx' : 'pdf'}`

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Export réussi', {
        description: `Le fichier ${filename} a été téléchargé`,
      })
    } catch (error) {
      console.error('Erreur export:', error)
      toast.error('Erreur lors de l\'export', {
        description: error instanceof Error ? error.message : 'Veuillez réessayer',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const typeLabel = type === 'quotes' ? 'devis' : 'factures'

  // Si export d'un seul document, afficher un menu simple
  if (documentId) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={className} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {!iconOnly && <span className="ml-2">Exporter</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Télécharger PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Télécharger Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Pour export de liste, afficher plus d'options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {!iconOnly && <span className="ml-2">Exporter</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport('excel', false)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel - Liste {typeLabel}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel', true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel - Avec détail lignes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Inclut récapitulatif et statistiques
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
