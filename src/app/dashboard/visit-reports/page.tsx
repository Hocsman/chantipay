'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
    Plus,
    Search,
    Loader2,
    Eye,
    Trash2,
    FileText,
    MapPin,
    Calendar,
    User,
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

export default function VisitReportsPage() {
    const router = useRouter()
    const [reports, setReports] = useState<VisitReport[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

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
            toast.error('Erreur lors du chargement des rapports')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/visit-reports/${deleteId}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Erreur suppression')

            setReports((prev) => prev.filter((r) => r.id !== deleteId))
            toast.success('Rapport supprimé')
        } catch (error) {
            console.error('Erreur suppression:', error)
            toast.error('Erreur lors de la suppression')
        } finally {
            setIsDeleting(false)
            setDeleteId(null)
        }
    }

    const filteredReports = reports.filter((report) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            report.client_name?.toLowerCase().includes(query) ||
            report.location?.toLowerCase().includes(query) ||
            report.summary?.toLowerCase().includes(query)
        )
    })

    return (
        <LayoutContainer>
            <div className="space-y-6 pb-24">
                <PageHeader
                    title="Rapports de visite"
                    description="Historique de vos rapports de visite technique."
                    action={
                        <Link href="/dashboard/visit-reports/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nouveau rapport
                            </Button>
                        </Link>
                    }
                />

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par client, lieu ou résumé..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Reports List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredReports.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'Aucun résultat' : 'Aucun rapport de visite'}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery
                                    ? 'Essayez une autre recherche'
                                    : 'Créez votre premier rapport de visite technique'}
                            </p>
                            {!searchQuery && (
                                <Link href="/dashboard/visit-reports/new">
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Créer un rapport
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Lieu</TableHead>
                                            <TableHead>Métier</TableHead>
                                            <TableHead>Photos</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredReports.map((report) => (
                                            <TableRow
                                                key={report.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/dashboard/visit-reports/${report.id}`)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(report.visit_date || report.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {report.client_name || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="truncate max-w-[200px]">
                                                            {report.location || '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {report.trade ? (
                                                        <Badge variant="secondary">
                                                            {tradeLabels[report.trade] || report.trade}
                                                        </Badge>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {report.photo_urls?.length || 0} photo(s)
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                router.push(`/dashboard/visit-reports/${report.id}`)
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setDeleteId(report.id)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {filteredReports.map((report) => (
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
                                                    setDeleteId(report.id)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* FAB for mobile */}
            <FloatingActionButton href="/dashboard/visit-reports/new" label="Nouveau rapport" />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
