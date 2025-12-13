import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize clients lazily to avoid build-time errors
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  })
}

/**
 * Stripe Webhook Handler
 *
 * Processes webhook events from Stripe for payment updates.
 * Handles checkout completions, payment successes, and failures.
 *
 * TODO: Ensure webhook signature verification is always enabled in production
 * TODO: Implement proper error handling and retry logic for database updates
 * TODO: Add monitoring/alerting for failed webhook processing
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // TODO: If Stripe is not configured, log and return 200 (acknowledge receipt)
  // This allows the app to build and run without Stripe credentials during development
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️  Stripe not configured - webhook event ignored')
    console.log('📨 Webhook payload (not processed):', body.substring(0, 200))
    return NextResponse.json({
      received: true,
      note: 'Stripe credentials not configured - event not processed'
    })
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripeClient()
    // TODO: Verify webhook signature to ensure authenticity
    // This prevents unauthorized webhook calls
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('❌ Erreur webhook Stripe (signature invalide):', errorMessage)
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    )
  }

  // Process Stripe webhook events
  // TODO: Add real mapping between Stripe session/payment intent and local quote
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      await handlePaymentSucceeded(paymentIntent)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      await handlePaymentFailed(paymentIntent)
      break
    }

    default:
      console.log(`ℹ️  Événement Stripe non géré: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id
  const supabaseAdmin = getSupabaseAdmin()

  // Trouver le paiement correspondant
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .select('*, quotes(*)')
    .eq('stripe_payment_intent_id', sessionId)
    .single()

  if (error || !payment) {
    console.error('Paiement non trouvé:', sessionId)
    return
  }

  // Mettre à jour le statut du paiement
  await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      paid_at: new Date().toISOString(),
    })
    .eq('id', payment.id)

  // Mettre à jour le devis
  await supabaseAdmin
    .from('quotes')
    .update({
      deposit_status: 'paid',
      status: 'deposit_paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.quote_id)

  console.log(`Paiement réussi pour le devis: ${payment.quote_id}`)
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id
  const supabaseAdmin = getSupabaseAdmin()

  // Mettre à jour le paiement si on le trouve
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (payment) {
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    await supabaseAdmin
      .from('quotes')
      .update({
        deposit_status: 'paid',
        status: 'deposit_paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.quote_id)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id
  const supabaseAdmin = getSupabaseAdmin()

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (payment) {
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
      })
      .eq('id', payment.id)
  }

  console.log(`Paiement échoué: ${paymentIntentId}`)
}
