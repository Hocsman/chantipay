/**
 * ===========================================
 * Stripe Webhook API
 * ===========================================
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhook events for subscription management.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  })
}

// Create Supabase admin client for webhooks (bypasses RLS)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Map Stripe status to our status
function mapSubscriptionStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    trialing: 'trial',
    paused: 'paused',
  }
  return statusMap[stripeStatus] || stripeStatus
}

// Extract plan from subscription
function extractPlanFromSubscription(subscription: Stripe.Subscription): string | null {
  // First try to get from metadata
  if (subscription.metadata?.plan) {
    return subscription.metadata.plan
  }
  
  // Otherwise, try to determine from price ID
  const priceId = subscription.items.data[0]?.price?.id
  if (priceId) {
    if (priceId === process.env.STRIPE_PRICE_SOLO_MONTHLY) {
      return 'solo'
    }
    if (priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY) {
      return 'team'
    }
  }
  
  return null
}

// Update profile with subscription data
async function updateProfileSubscription(
  customerId: string,
  subscriptionData: {
    stripe_subscription_id?: string | null
    subscription_status: string
    subscription_plan?: string | null
    current_period_end?: string | null
  }
) {
  const supabase = getSupabaseAdmin()
  
  const { error } = await supabase
    .from('profiles')
    .update(subscriptionData)
    .eq('stripe_customer_id', customerId)
  
  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log(`Stripe webhook received: ${event.type}`)

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          // Subscription was created via checkout
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const customerId = session.customer as string
          const plan = session.metadata?.plan || extractPlanFromSubscription(subscription as unknown as Stripe.Subscription)
          
          // Get current_period_end from subscription object
          const subData = subscription as unknown as { current_period_end?: number }
          const periodEnd = subData.current_period_end 
            ? new Date(subData.current_period_end * 1000).toISOString()
            : null
          
          await updateProfileSubscription(customerId, {
            stripe_subscription_id: subscription.id,
            subscription_status: mapSubscriptionStatus(subscription.status),
            subscription_plan: plan,
            current_period_end: periodEnd,
          })
          
          console.log(`Subscription created for customer ${customerId}, plan: ${plan}`)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const plan = extractPlanFromSubscription(subscription)
        
        // Get current_period_end from subscription object
        const subData = subscription as unknown as { current_period_end?: number }
        const periodEnd = subData.current_period_end 
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null
        
        await updateProfileSubscription(customerId, {
          stripe_subscription_id: subscription.id,
          subscription_status: mapSubscriptionStatus(subscription.status),
          subscription_plan: plan,
          current_period_end: periodEnd,
        })
        
        console.log(`Subscription ${event.type.split('.')[2]} for customer ${customerId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        
        await updateProfileSubscription(customerId, {
          stripe_subscription_id: null,
          subscription_status: 'canceled',
          subscription_plan: null,
          current_period_end: null,
        })
        
        console.log(`Subscription deleted for customer ${customerId}`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Get subscription from invoice (using type assertion for compatibility)
        const invoiceData = invoice as unknown as { subscription?: string }
        
        // Update subscription status to active on successful payment
        if (invoiceData.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceData.subscription
          )
          
          // Get current_period_end from subscription object
          const subData = subscription as unknown as { current_period_end?: number }
          const periodEnd = subData.current_period_end 
            ? new Date(subData.current_period_end * 1000).toISOString()
            : null
          
          await updateProfileSubscription(customerId, {
            subscription_status: mapSubscriptionStatus(subscription.status),
            current_period_end: periodEnd,
          })
          
          console.log(`Invoice paid for customer ${customerId}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        
        // Mark subscription as past_due
        await updateProfileSubscription(customerId, {
          subscription_status: 'past_due',
        })
        
        console.log(`Payment failed for customer ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return 200 quickly to acknowledge receipt
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 200 to prevent Stripe from retrying
    return NextResponse.json(
      { error: 'Webhook handler failed', received: true },
      { status: 200 }
    )
  }
}
