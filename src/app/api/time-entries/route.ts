import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/time-entries
 * Liste les pointages (filtrable par technicien et date)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technician_id')
    const date = searchParams.get('date')

    let query = supabase
      .from('time_entries')
      .select(`
        *,
        technician:technicians(id, first_name, last_name)
      `)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    if (technicianId) {
      query = query.eq('technician_id', technicianId)
    }

    if (date) {
      query = query.gte('timestamp', `${date}T00:00:00`)
        .lt('timestamp', `${date}T23:59:59`)
    }

    const { data: entries, error } = await query.limit(100)

    if (error) {
      console.error('Erreur récupération pointages:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Erreur API time-entries:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/time-entries
 * Crée un nouveau pointage (avec GPS et photo optionnels)
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
      technicianId,
      entryType,
      latitude,
      longitude,
      locationAccuracy,
      locationAddress,
      photoBase64,
      taskId,
      notes,
    } = body

    if (!technicianId || !entryType) {
      return NextResponse.json({ error: 'Technicien et type de pointage requis' }, { status: 400 })
    }

    const validTypes = ['clock_in', 'clock_out', 'break_start', 'break_end']
    if (!validTypes.includes(entryType)) {
      return NextResponse.json({ error: 'Type de pointage invalide' }, { status: 400 })
    }

    // Vérifier que le technicien appartient à l'utilisateur
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select('id')
      .eq('id', technicianId)
      .eq('user_id', user.id)
      .single()

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technicien non trouvé' }, { status: 404 })
    }

    // Upload photo si fournie
    let photoUrl: string | null = null
    if (photoBase64) {
      const matches = photoBase64.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        const extension = mimeType.split('/')[1] || 'jpg'
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${user.id}/${Date.now()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('time-entries')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false,
          })

        if (!uploadError) {
          photoUrl = fileName
        }
      }
    }

    // Créer le pointage
    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: user.id,
        technician_id: technicianId,
        entry_type: entryType,
        timestamp: new Date().toISOString(),
        latitude: latitude || null,
        longitude: longitude || null,
        location_accuracy: locationAccuracy || null,
        location_address: locationAddress || null,
        photo_url: photoUrl,
        task_id: taskId || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création pointage:', error)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Erreur API time-entries POST:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
