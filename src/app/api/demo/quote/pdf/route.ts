import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/lib/pdf/QuotePdf'
import {
  demoProfile,
  demoClient,
  demoQuote,
  demoItems,
} from '@/lib/demo/demoData'

// Build complete quote object for PDF (with all required fields)
function buildQuoteForPdf(signatureDataUrl: string | null) {
  return {
    id: demoQuote.id,
    user_id: 'demo-user-id',
    client_id: demoClient.id,
    quote_number: demoQuote.quote_number,
    status: (signatureDataUrl ? 'signed' : 'sent') as 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled',
    total_ht: demoQuote.total_ht,
    total_ttc: demoQuote.total_ttc,
    vat_rate: demoQuote.vat_rate,
    currency: 'EUR',
    deposit_amount: demoQuote.deposit_amount,
    deposit_status: (demoQuote.deposit_paid_at ? 'paid' : 'pending') as 'pending' | 'paid' | null,
    deposit_paid_at: demoQuote.deposit_paid_at,
    deposit_method: demoQuote.deposit_method as 'virement' | 'cash' | 'cheque' | 'autre' | null,
    signature_image_url: signatureDataUrl,
    signed_at: signatureDataUrl ? new Date().toISOString() : null,
    payment_link_url: null,
    expires_at: demoQuote.valid_until,
    work_location: null,
    created_at: demoQuote.created_at,
    updated_at: demoQuote.updated_at,
  }
}

// Build client object with correct field names
function buildClientForPdf() {
  return {
    id: demoClient.id,
    user_id: 'demo-user-id',
    name: demoClient.name,
    email: demoClient.email,
    phone: demoClient.phone,
    address_line1: demoClient.address,
    postal_code: demoClient.postal_code,
    city: demoClient.city,
    notes: demoClient.notes,
    created_at: new Date().toISOString(),
  }
}

// Build quote items with correct field names
function buildItemsForPdf() {
  return demoItems.map((item, index) => ({
    id: item.id,
    quote_id: item.quote_id,
    description: item.description,
    quantity: item.quantity,
    unit_price_ht: item.unit_price_ht,
    vat_rate: item.vat_rate,
    sort_order: index + 1,
    created_at: new Date().toISOString(),
  }))
}

// Build profile for PDF
function buildProfileForPdf() {
  return {
    id: demoProfile.id,
    email: demoProfile.email,
    full_name: `${demoProfile.first_name} ${demoProfile.last_name}`,
    company_name: demoProfile.company_name,
    phone: demoProfile.phone,
    address: `${demoProfile.address}, ${demoProfile.postal_code} ${demoProfile.city}`,
    siret: demoProfile.siret,
    vat_number: null,
    tax_status: 'standard' as const,
    is_subcontractor: false,
    rcs: null,
    ape_code: null,
    share_capital: null,
    role: 'owner',
    subscription_status: 'trial',
    subscription_plan: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    current_period_end: null,
    created_at: new Date().toISOString(),
  }
}

// Build settings for PDF
function buildSettingsForPdf() {
  return {
    id: 'demo-settings-id',
    user_id: 'demo-user-id',
    company_logo_url: demoProfile.logo_url,
    default_vat_rate: demoProfile.default_vat_rate,
    default_deposit_percent: 30,
    pdf_footer_text: demoProfile.default_payment_terms,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get signature from request body (optional)
    let signatureDataUrl: string | null = null
    try {
      const body = await request.json()
      signatureDataUrl = body.signatureDataUrl || null
    } catch {
      // No body or invalid JSON, continue without signature
    }

    // Generate PDF using the existing template
    const pdfBuffer = await renderToBuffer(
      QuotePdfDocument({
        quote: buildQuoteForPdf(signatureDataUrl),
        quoteItems: buildItemsForPdf(),
        client: buildClientForPdf(),
        profile: buildProfileForPdf(),
        settings: buildSettingsForPdf(),
      })
    )

    // Convertir le Buffer en Uint8Array pour la compatibilité avec Response
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF response
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="devis-demo-chantipay.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Demo PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF de démo' },
      { status: 500 }
    )
  }
}

// Also support GET for direct link access (without signature)
export async function GET() {
  try {
    // Generate PDF using the existing template
    const pdfBuffer = await renderToBuffer(
      QuotePdfDocument({
        quote: buildQuoteForPdf(null),
        quoteItems: buildItemsForPdf(),
        client: buildClientForPdf(),
        profile: buildProfileForPdf(),
        settings: buildSettingsForPdf(),
      })
    )

    // Convertir le Buffer en Uint8Array pour la compatibilité avec Response
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF response
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="devis-demo-chantipay.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Demo PDF generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF de démo' },
      { status: 500 }
    )
  }
}
