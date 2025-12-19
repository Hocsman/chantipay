/**
 * ===========================================
 * Stripe Checkout Session API
 * ===========================================
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for SaaS subscription.
 * Body: { plan: 'solo' | 'team' }
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Valid plans
const VALID_PLANS = ['solo', 'team'] as const
type Plan = typeof VALID_PLANS[number]

// Initialize Stripe
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
  })
}

// Map plan to price ID
function getPriceId(plan: Plan): string {
  const priceMap: Record<Plan, string | undefined> = {
    solo: process.env.STRIPE_PRICE_SOLO_MONTHLY,
    team: process.env.STRIPE_PRICE_TEAM_MONTHLY,
  }
  
  const priceId = priceMap[plan]
  if (!priceId) {
    throw new Error(`Price ID not configured for plan: ${plan}`)
  }
  return priceId
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { plan } = body as { plan: string }

    // Validate plan
    if (!plan || !VALID_PLANS.includes(plan as Plan)) {
      return NextResponse.json(
        { error: 'Plan invalide', validPlans: VALID_PLANS },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name, company_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    // Initialize Stripe
    const stripe = getStripe()
    let customerId = profile.stripe_customer_id

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        name: profile.company_name || profile.full_name || undefined,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get price ID for the plan
    const priceId = getPriceId(plan as Plan)

    // Create Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=1`,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
