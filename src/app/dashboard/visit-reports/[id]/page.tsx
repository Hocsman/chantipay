'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    ArrowLeft,
    Loader2,
    FileText,
    Trash2,
    Calendar,
    MapPin,
    User,
    Wrench,
    AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

interface VisitReport {
    id: string
    client_name: string | null
    location: string | null
    visit_date: string | null
    trade: string | null
    context: string | null
    summary: string
    diagnostics: string[]
    non_conformities: Array<{
        title: string
        severity: 'low' | 'medium' | 'high'
        reference?: string
        recommendation?: string
    }>
    recommendations: string[]
    photo_annotations: Array<{
        index: number
        title: string
        annotations: string[]
        notes?: string
    }>
    photo_urls: string[]
    signedPhotoUrls: string[]
    created_at: string
}

const tradeLabels: Record<string, string> = {
    plomberie: 'Plomberie',
    electricite: 'Électricité',
    renovation: 'Rénovation',
    peinture: 'Peinture',
    menuiserie: 'Menuiserie',
    autre: 'Autre',
}

function formatDate(dateString: string | null) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

function severityBadgeVariant(severity: 'low' | 'medium' | 'high') {
    if (severity === 'high') return 'destructive' as const
    if (severity === 'medium') return 'secondary' as const
    return 'outline' as const
}

export default function ViewVisitReportPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const router = useRouter()
    const [report, setReport] = useState<VisitReport | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    useEffect(() => {
        loadReport()
    }, [id])

    const loadReport = async () => {
        try {
            const response = await fetch(`/api/visit-reports/${id}`)
            if (!response.ok) throw new Error('Rapport non trouvé')
            const data = await response.json()
            setReport(data.report)
        } catch (error) {
            console.error('Erreur chargement rapport:', error)
            toast.error('Erreur lors du chargement du rapport')
            router.push('/dashboard/visit-reports')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/visit-reports/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur suppression')

            toast.success('Rapport supprimé')
            router.push('/dashboard/visit-reports')
        } catch (error) {
            console.error('Erreur suppression:', error)
            toast.error('Erreur lors de la suppression')
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    const handleDownloadPdf = async () => {
        if (!report) return

        setIsDownloading(true)
        try {
            const response = await fetch('/api/visit-reports/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    report: {
                        summary: report.summary,
                        diagnostics: report.diagnostics,
                        nonConformities: report.non_conformities,
                        photoAnnotations: report.photo_annotations,
                        recommendations: report.recommendations,
                    },
                    photos: report.signedPhotoUrls || [],
                    metadata: {
                        clientName: report.client_name,
                        location: report.location,
                        visitDate: report.visit_date,
                        trade: report.trade,
                        context: report.context,
                    },
                    useUrls: true,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur génération PDF')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `rapport-visite-${report.client_name || 'client'}-${report.id.slice(0, 8)}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('PDF téléchargé')
        } catch (error) {
            console.error('Erreur téléchargement PDF:', error)
            toast.error('Erreur lors du téléchargement du PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    if (isLoading) {
        return (
            <LayoutContainer>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </LayoutContainer>
        )
    }

    if (!report) {
        return (
            <LayoutContainer>
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Rapport non trouvé</p>
                    <Link href="/dashboard/visit-reports">
                        <Button variant="link">Retour à la liste</Button>
                    </Link>
                </div>
            </LayoutContainer>
        )
    }

    return (
        <LayoutContainer>
            <div className="space-y-6 pb-24">
                <PageHeader
                    title="Rapport de visite"
                    description={`Créé le ${formatDate(report.created_at)}`}
                    action={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
                                {isDownloading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4 mr-2" />
                                )}
                                Télécharger PDF
                            </Button>
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    }
                />

                <Link
                    href="/dashboard/visit-reports"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la liste
                </Link>

                {/* Metadata Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations de visite</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Client</p>
                                <p className="font-medium">{report.client_name || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Date de visite</p>
                                <p className="font-medium">{formatDate(report.visit_date)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Lieu</p>
                                <p className="font-medium">{report.location || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Métier</p>
                                <p className="font-medium">
                                    {report.trade ? tradeLabels[report.trade] || report.trade : '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Résumé</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{report.summary}</p>
                    </CardContent>
                </Card>

                {/* Context */}
                {report.context && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Contexte</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{report.context}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Diagnostics */}
                {report.diagnostics && report.diagnostics.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Diagnostics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {report.diagnostics.map((item, index) => (
                                    <li key={index} className="flex gap-2 text-muted-foreground">
                                        <span>•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Non-conformities */}
                {report.non_conformities && report.non_conformities.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Non-conformités détectées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {report.non_conformities.map((item, index) => (
                                <div key={index} className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                        <span className="font-medium">{item.title}</span>
                                        <Badge variant={severityBadgeVariant(item.severity)}>
                                            {item.severity}
                                        </Badge>
                                    </div>
                                    {item.reference && (
                                        <p className="text-sm text-muted-foreground">
                                            Référence: {item.reference}
                                        </p>
                                    )}
                                    {item.recommendation && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Recommandation: {item.recommendation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Recommendations */}
                {report.recommendations && report.recommendations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommandations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {report.recommendations.map((item, index) => (
                                    <li key={index} className="flex gap-2 text-muted-foreground">
                                        <span>•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Photos with Annotations */}
                {report.signedPhotoUrls && report.signedPhotoUrls.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Photos et annotations</CardTitle>
                            <CardDescription>
                                {report.signedPhotoUrls.length} photo(s) analysée(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {report.signedPhotoUrls.map((url, index) => {
                                    const annotation = report.photo_annotations?.find(
                                        (a) => a.index === index
                                    )
                                    return (
                                        <div key={index} className="rounded-lg border p-4">
                                            <img
                                                src={url}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-md mb-3"
                                            />
                                            <p className="font-medium">
                                                {annotation?.title || `Photo ${index + 1}`}
                                            </p>
                                            {annotation?.annotations && annotation.annotations.length > 0 && (
                                                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                                    {annotation.annotations.map((note, noteIndex) => (
                                                        <li key={noteIndex} className="flex gap-2">
                                                            <span>•</span>
                                                            <span>{note}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {annotation?.notes && (
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    Notes: {annotation.notes}
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le rapport ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le rapport et ses photos seront définitivement
                            supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Suppression...
                                </>
                            ) : (
                                'Supprimer'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </LayoutContainer>
    )
}
