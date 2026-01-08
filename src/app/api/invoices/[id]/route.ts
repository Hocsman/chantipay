import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Récupérer la facture
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
  }

  // Récupérer les lignes de facture
  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order')

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ invoice: { ...invoice, items } })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()

  // Validation du statut de paiement
  const validPaymentStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'canceled']
  if (body.payment_status && !validPaymentStatuses.includes(body.payment_status)) {
    return NextResponse.json(
      { error: 'Statut de paiement invalide' },
      { status: 400 }
    )
  }

  const updateData: any = {}
  
  // Champs modifiables
  if (body.client_name !== undefined) updateData.client_name = body.client_name
  if (body.client_email !== undefined) updateData.client_email = body.client_email
  if (body.client_phone !== undefined) updateData.client_phone = body.client_phone
  if (body.client_address !== undefined) updateData.client_address = body.client_address
  if (body.client_siret !== undefined) updateData.client_siret = body.client_siret
  if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
  if (body.tax_rate !== undefined) updateData.tax_rate = body.tax_rate
  if (body.tax_amount !== undefined) updateData.tax_amount = body.tax_amount
  if (body.total !== undefined) updateData.total = body.total
  if (body.payment_status !== undefined) updateData.payment_status = body.payment_status
  if (body.payment_method !== undefined) updateData.payment_method = body.payment_method
  if (body.paid_amount !== undefined) updateData.paid_amount = body.paid_amount
  if (body.due_date !== undefined) updateData.due_date = body.due_date
  if (body.issue_date !== undefined) updateData.issue_date = body.issue_date
  if (body.notes !== undefined) updateData.notes = body.notes
  if (body.payment_terms !== undefined) updateData.payment_terms = body.payment_terms
  if (body.sent_at !== undefined) updateData.sent_at = body.sent_at

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Si des items sont fournis, les mettre à jour
  if (body.items && Array.isArray(body.items)) {
    // Supprimer les anciennes lignes
    await supabase.from('invoice_items').delete().eq('invoice_id', id)

    // Insérer les nouvelles lignes
    if (body.items.length > 0) {
      const invoiceItems = body.items.map((item: any, index: number) => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: item.total || 0,
        sort_order: index,
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems)

      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }
    }
  }

  // Récupérer la facture complète avec items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order')

  return NextResponse.json({ invoice: { ...invoice, items } })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
