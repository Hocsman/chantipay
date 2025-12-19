/**
 * ===========================================
 * Manual Deposit Marking API
 * ===========================================
 * POST /api/quotes/[id]/deposit
 * 
 * Marks a quote's deposit as paid manually (no Stripe).
 * Body: { method: 'virement' | 'cash' | 'cheque' | 'autre' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Valid deposit payment methods
const VALID_METHODS = ['virement', 'cash', 'cheque', 'autre'] as const
type DepositMethod = typeof VALID_METHODS[number]

interface DepositRequestBody {
  method: DepositMethod
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    
    // Parse and validate request body
    let body: DepositRequestBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400 }
      )
    }

    const { method } = body

    // Validate method
    if (!method || !VALID_METHODS.includes(method)) {
      return NextResponse.json(
        { 
          error: 'Méthode de paiement invalide',
          validMethods: VALID_METHODS 
        },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Fetch the quote and verify ownership
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, user_id, deposit_status, deposit_amount')
      .eq('id', quoteId)
      .single()

    if (fetchError || !quote) {
      console.error('Quote fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (quote.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Check if deposit is already paid
    if (quote.deposit_status === 'paid') {
      return NextResponse.json(
        { error: 'L\'acompte est déjà marqué comme payé' },
        { status: 400 }
      )
    }

    // Update the quote with deposit payment info
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        deposit_status: 'paid',
        deposit_paid_at: new Date().toISOString(),
        deposit_method: method,
      })
      .eq('id', quoteId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Quote update error:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du devis' },
        { status: 500 }
      )
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Acompte marqué comme payé',
      data: {
        quoteId,
        method,
        paidAt: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Deposit API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
