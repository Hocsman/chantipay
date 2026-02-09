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
    .select(`
      *,
      items:invoice_items (
        id,
        description,
        quantity,
        unit_price
      )
    `)
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

  // 🔒 SÉCURITÉ: Recalculer les montants côté serveur si des items sont fournis
  let finalSubtotal = body.subtotal || 0
  let finalTaxAmount = body.tax_amount || 0
  let finalTotal = body.total || 0

  if (body.items && Array.isArray(body.items) && body.items.length > 0) {
    // Recalculer pour éviter la manipulation client-side
    finalSubtotal = body.items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    )

    // Calculer la TVA totale (peut être mixte maintenant)
    finalTaxAmount = body.items.reduce((sum: number, item: any) => {
      const lineTotal = (item.quantity || 0) * (item.unit_price || 0)
      const vatRate = item.vat_rate || body.tax_rate || 20
      return sum + lineTotal * (vatRate / 100)
    }, 0)

    finalTotal = finalSubtotal + finalTaxAmount

    // Arrondir à 2 décimales
    finalSubtotal = Math.round(finalSubtotal * 100) / 100
    finalTaxAmount = Math.round(finalTaxAmount * 100) / 100
    finalTotal = Math.round(finalTotal * 100) / 100
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
      subtotal: finalSubtotal,
      tax_rate: body.tax_rate || 20.0,
      tax_amount: finalTaxAmount,
      total: finalTotal,
      payment_status: body.payment_status || 'draft',
      payment_method: body.payment_method || null,
      paid_amount: body.paid_amount || 0,
      due_date: body.due_date || null,
      issue_date: body.issue_date,
      notes: body.notes || null,
      payment_terms: body.payment_terms || null,
      work_location: body.work_location || null,
      is_subcontracting: body.is_subcontracting || false,
    })
    .select()
    .single()

  if (invoiceError) {
    return NextResponse.json({ error: invoiceError.message }, { status: 500 })
  }

  // Créer les lignes de facture si fournies
  if (body.items && Array.isArray(body.items) && body.items.length > 0) {
    const invoiceItems = body.items.map((item: any, index: number) => {
      // Recalculer le total de chaque ligne pour sécurité
      const lineTotal = Math.round((item.quantity || 0) * (item.unit_price || 0) * 100) / 100

      return {
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: lineTotal,
        sort_order: index,
      }
    })

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
