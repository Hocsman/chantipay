'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MobileHeader } from '@/components/mobile/MobileHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Loader2,
    Trash2,
    Calendar,
    MapPin,
    User,
    FileText,
    ClipboardList,
} from 'lucide-react'
import { toast } from 'sonner'
import { FloatingActionButton } from '@/components/FloatingActionButton'

interface VisitReport {
    id: string
    client_name: string | null
    location: string | null
    visit_date: string | null
    trade: string | null
    summary: string
    created_at: string
    photo_urls: string[]
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
        month: 'short',
        year: 'numeric',
    })
}

export default function MobileVisitReportsPage() {
    const router = useRouter()
    const [reports, setReports] = useState<VisitReport[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = async () => {
        try {
            const response = await fetch('/api/visit-reports')
            if (!response.ok) throw new Error('Erreur chargement')
            const data = await response.json()
            setReports(data.reports || [])
        } catch (error) {
            console.error('Erreur chargement rapports:', error)
            toast.error('Erreur lors du chargement')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (reportId: string) => {
        try {
            const response = await fetch(`/api/visit-reports/${reportId}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur suppression')

            setReports((prev) => prev.filter((r) => r.id !== reportId))
            toast.success('Rapport supprimé')
        } catch (error) {
            console.error('Erreur suppression:', error)
            toast.error('Erreur lors de la suppression')
        }
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            <MobileHeader title="Rapports de visite" />

            <div className="p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : reports.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Aucun rapport</h3>
                            <p className="text-muted-foreground mb-4">
                                Créez votre premier rapport de visite
                            </p>
                            <Link href="/mobile/visit-reports/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Créer un rapport
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    reports.map((report) => (
                        <Card
                            key={report.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/dashboard/visit-reports/${report.id}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        {report.client_name || 'Client non renseigné'}
                                    </CardTitle>
                                    {report.trade && (
                                        <Badge variant="secondary" className="text-xs">
                                            {tradeLabels[report.trade] || report.trade}
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(report.visit_date || report.created_at)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{report.location || '-'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {report.summary}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <Badge variant="outline" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {report.photo_urls?.length || 0} photo(s)
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(report.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <FloatingActionButton href="/mobile/visit-reports/new" label="Nouveau rapport" />
        </div>
    )
}
