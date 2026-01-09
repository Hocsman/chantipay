import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .select(`
      *,
      items:credit_note_items (
        id,
        description,
        quantity,
        unit_price,
        total,
        sort_order
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !creditNote) {
    return NextResponse.json({ error: 'Avoir non trouvé' }, { status: 404 })
  }

  return NextResponse.json({ creditNote })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()

  // S'assurer que les montants restent négatifs si fournis
  const updateData: any = { ...body }
  if (updateData.subtotal) updateData.subtotal = -Math.abs(updateData.subtotal)
  if (updateData.tax_amount) updateData.tax_amount = -Math.abs(updateData.tax_amount)
  if (updateData.total) updateData.total = -Math.abs(updateData.total)

  const { data: creditNote, error } = await supabase
    .from('credit_notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ creditNote })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { error } = await supabase
    .from('credit_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
