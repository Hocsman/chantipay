import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/visit-reports/[id]
 * Get a single visit report by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { data: report, error } = await supabase
            .from('visit_reports')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !report) {
            return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
        }

        // Generate signed URLs for photos
        const photoUrls: string[] = []
        if (report.photo_urls && Array.isArray(report.photo_urls)) {
            for (const path of report.photo_urls) {
                const { data } = await supabase.storage
                    .from('visit-reports')
                    .createSignedUrl(path, 3600) // 1 hour expiry

                if (data?.signedUrl) {
                    photoUrls.push(data.signedUrl)
                }
            }
        }

        return NextResponse.json({
            report: {
                ...report,
                signedPhotoUrls: photoUrls,
            },
        })
    } catch (error) {
        console.error('Erreur API visit-reports/[id]:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

/**
 * DELETE /api/visit-reports/[id]
 * Delete a visit report and its photos
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // First get the report to retrieve photo URLs
        const { data: report, error: fetchError } = await supabase
            .from('visit_reports')
            .select('photo_urls')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !report) {
            return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
        }

        // Delete photos from storage
        if (report.photo_urls && Array.isArray(report.photo_urls) && report.photo_urls.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('visit-reports')
                .remove(report.photo_urls)

            if (storageError) {
                console.error('Erreur suppression photos:', storageError)
                // Continue with report deletion even if photo deletion fails
            }
        }

        // Delete the report
        const { error: deleteError } = await supabase
            .from('visit_reports')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (deleteError) {
            console.error('Erreur suppression rapport:', deleteError)
            return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur API visit-reports/[id] DELETE:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
