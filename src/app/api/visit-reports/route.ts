import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/visit-reports
 * List all visit reports for the authenticated user
 */
export async function GET() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const { data: reports, error } = await supabase
            .from('visit_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erreur récupération rapports:', error)
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
        }

        return NextResponse.json({ reports })
    } catch (error) {
        console.error('Erreur API visit-reports:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

/**
 * POST /api/visit-reports
 * Create a new visit report with photos
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const {
            clientName,
            location,
            visitDate,
            trade,
            context,
            summary,
            diagnostics,
            nonConformities,
            recommendations,
            photoAnnotations,
            photos, // Array of base64 images
        } = body

        if (!summary) {
            return NextResponse.json({ error: 'Le résumé est requis' }, { status: 400 })
        }

        // Upload photos to storage
        const photoUrls: string[] = []
        if (photos && Array.isArray(photos)) {
            for (let i = 0; i < photos.length; i++) {
                const base64 = photos[i]
                if (!base64) continue

                // Extract mime type and data from base64
                const matches = base64.match(/^data:([^;]+);base64,(.+)$/)
                if (!matches) continue

                const mimeType = matches[1]
                const base64Data = matches[2]
                const extension = mimeType.split('/')[1] || 'jpg'

                // Convert base64 to buffer
                const buffer = Buffer.from(base64Data, 'base64')

                // Generate unique filename
                const fileName = `${user.id}/${Date.now()}-${i}.${extension}`

                const { error: uploadError } = await supabase.storage
                    .from('visit-reports')
                    .upload(fileName, buffer, {
                        contentType: mimeType,
                        upsert: false,
                    })

                if (uploadError) {
                    console.error('Erreur upload photo:', uploadError)
                    continue
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('visit-reports')
                    .getPublicUrl(fileName)

                if (urlData?.publicUrl) {
                    photoUrls.push(fileName) // Store path, not full URL
                }
            }
        }

        // Create the report
        const { data: report, error: insertError } = await supabase
            .from('visit_reports')
            .insert({
                user_id: user.id,
                client_name: clientName || null,
                location: location || null,
                visit_date: visitDate || null,
                trade: trade || null,
                context: context || null,
                summary,
                diagnostics: diagnostics || [],
                non_conformities: nonConformities || [],
                recommendations: recommendations || [],
                photo_annotations: photoAnnotations || [],
                photo_urls: photoUrls,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Erreur création rapport:', insertError)
            return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
        }

        return NextResponse.json({ report }, { status: 201 })
    } catch (error) {
        console.error('Erreur API visit-reports POST:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
