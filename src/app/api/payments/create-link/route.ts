import { NextRequest, NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

/**
 * ===========================================
 * Stripe Payment Link Creation API Route
 * ===========================================
 * POST /api/payments/create-link
 *
 * Creates a Stripe Checkout Session for deposit payment on a signed quote.
 * If STRIPE_SECRET_KEY is not configured, returns a mock payment URL.
 *
 * Request Body:
 * {
 *   quoteId: string;  // Required: UUID of the signed quote
 * }
 *
 * Response:
 * {
 *   paymentUrl: string;   // URL to redirect customer for payment
 *   sessionId: string;    // Stripe session ID for tracking
 * }
 *
 * Status Codes:
 * - 200: Success - payment link created
 * - 400: Bad request (missing quoteId or quote not signed)
 * - 401: Unauthorized (user not authenticated)
 * - 404: Quote not found or doesn't belong to user
 * - 500: Server error
 *
 * Business Logic:
 * 1. Verify user is authenticated
 * 2. Load quote with client details
 * 3. Verify quote is signed (status === 'signed')
 * 4. Create Stripe Checkout Session for deposit amount
 * 5. Update quote with payment_link_url
 * 6. Create payment record with 'pending' status
 *
 * TODO: Add validation for deposit_amount > 0
 * TODO: Consider idempotency - check if payment already exists
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { quoteId } = body

    if (!quoteId) {
      return NextResponse.json(
        { error: 'Le champ "quoteId" est requis' },
        { status: 400 }
      )
    }

    // Récupérer le devis
    const { data, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', quoteId)
      .eq('user_id', user.id)
      .single()

    if (quoteError || !data) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote = data as any

    // Vérifier que le devis est signé
    if (quote.status !== 'signed') {
      return NextResponse.json(
        { error: 'Le devis doit être signé avant de créer un lien de paiement' },
        { status: 400 }
      )
    }

    // Créer le lien de paiement Stripe
    const paymentResult = await createPaymentLink({
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      amount: quote.deposit_amount,
      currency: quote.currency || 'EUR',
      customerEmail: quote.clients?.email,
      customerName: quote.clients?.name,
    })

    // Mettre à jour le devis avec le lien de paiement
    await supabase
      .from('quotes')
      .update({
        payment_link_url: paymentResult.url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    // Créer un enregistrement de paiement
    await supabase
      .from('payments')
      .insert({
        quote_id: quoteId,
        stripe_payment_intent_id: paymentResult.sessionId,
        amount: quote.deposit_amount || 0,
        type: 'deposit',
        status: 'pending',
      })

    return NextResponse.json({
      paymentUrl: paymentResult.url,
      sessionId: paymentResult.sessionId,
    })
  } catch (error) {
    console.error('Erreur création lien paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du lien de paiement' },
      { status: 500 }
    )
  }
}
