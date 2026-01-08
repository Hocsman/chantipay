import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('issue_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invoices })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()

  // Validation
  if (!body.client_name || !body.issue_date) {
    return NextResponse.json(
      { error: 'Le nom du client et la date d\'émission sont requis' },
      { status: 400 }
    )
  }

  // Validation du statut de paiement
  const validPaymentStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'canceled']
  if (body.payment_status && !validPaymentStatuses.includes(body.payment_status)) {
    return NextResponse.json(
      { error: 'Statut de paiement invalide' },
      { status: 400 }
    )
  }

  // Créer la facture
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      quote_id: body.quote_id || null,
      client_id: body.client_id || null,
      client_name: body.client_name,
      client_email: body.client_email || null,
      client_phone: body.client_phone || null,
      client_address: body.client_address || null,
      client_siret: body.client_siret || null,
      subtotal: body.subtotal || 0,
      tax_rate: body.tax_rate || 20.0,
      tax_amount: body.tax_amount || 0,
      total: body.total || 0,
      payment_status: body.payment_status || 'draft',
      payment_method: body.payment_method || null,
      paid_amount: body.paid_amount || 0,
      due_date: body.due_date || null,
      issue_date: body.issue_date,
      notes: body.notes || null,
      payment_terms: body.payment_terms || null,
    })
    .select()
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 })
  }

  // Créer les lignes de facture si fournies
  if (body.items && Array.isArray(body.items) && body.items.length > 0) {
    const invoiceItems = body.items.map((item: any, index: number) => ({
      invoice_id: invoice.id,
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
      // Rollback: supprimer la facture si les lignes échouent
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ invoice }, { status: 201 })
}
