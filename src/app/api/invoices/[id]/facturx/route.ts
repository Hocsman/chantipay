import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateFacturXOnly } from '@/lib/facturx'

/**
 * API Route pour générer le XML Factur-X d'une facture
 * GET /api/invoices/[id]/facturx
 * 
 * Retourne le XML Factur-X conforme EN 16931
 */
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

  if (invoiceError || !invoice) {
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

  // Récupérer le profil utilisateur (vendeur)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
  }

  // Préparer les données de facture
  const invoiceData = {
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    client_name: invoice.client_name,
    client_email: invoice.client_email,
    client_phone: invoice.client_phone,
    client_address: invoice.client_address,
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    total: invoice.total,
    payment_terms: invoice.payment_terms,
    notes: invoice.notes,
    items: items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      vat_rate: item.vat_rate ?? invoice.tax_rate,
    })),
  }

  // Données du vendeur
  const seller = {
    company_name: profile.company_name,
    full_name: profile.full_name,
    address: profile.address,
    phone: profile.phone,
    email: profile.email || user.email,
    siret: profile.siret,
    vat_number: profile.vat_number,
  }

  // Données de l'acheteur (client)
  const buyer = {
    name: invoice.client_name,
    address: invoice.client_address,
    email: invoice.client_email,
    phone: invoice.client_phone,
    siret: invoice.client_siret,
    vat_number: null, // À ajouter si nécessaire
  }

  try {
    // Générer le XML Factur-X
    const xmlContent = generateFacturXOnly(invoiceData, seller, buyer, 'EN16931')

    // Déterminer le type de réponse
    const url = new URL(request.url)
    const format = url.searchParams.get('format')

    if (format === 'download') {
      // Téléchargement direct du fichier XML
      return new Response(xmlContent, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="facture-${invoice.invoice_number}-facturx.xml"`,
        },
      })
    }

    // Réponse JSON avec le contenu XML
    return NextResponse.json({
      success: true,
      invoice_number: invoice.invoice_number,
      xml: xmlContent,
    })
  } catch (error) {
    console.error('Erreur génération Factur-X:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du XML Factur-X' },
      { status: 500 }
    )
  }
}
