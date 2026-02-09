import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/technicians/[id]
 * Récupère un technicien par son ID
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

    const { data: technician, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !technician) {
      return NextResponse.json({ error: 'Technicien non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ technician })
  } catch (error) {
    console.error('Erreur API technician GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PATCH /api/technicians/[id]
 * Met à jour un technicien
 */
export async function PATCH(
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

    const body = await request.json()
    const updates: Record<string, any> = {}

    if (body.firstName !== undefined) updates.first_name = body.firstName
    if (body.lastName !== undefined) updates.last_name = body.lastName
    if (body.email !== undefined) updates.email = body.email
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.specialties !== undefined) updates.specialties = body.specialties
    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes

    const { data: technician, error } = await supabase
      .from('technicians')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour technicien:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ technician })
  } catch (error) {
    console.error('Erreur API technician PATCH:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * DELETE /api/technicians/[id]
 * Supprime un technicien
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

    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression technicien:', error)
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API technician DELETE:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
