import Stripe from 'stripe';

// Initialize Stripe lazily to avoid build-time errors
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return stripeClient;
}

interface CreatePaymentLinkParams {
  quoteId: string;
  quoteNumber: string;
  amount: number | null;
  currency: string;
  customerEmail?: string | null;
  customerName?: string | null;
}

interface PaymentLinkResult {
  url: string;
  sessionId: string;
}

/**
 * Create a Stripe Checkout Session for deposit payment
 *
 * If STRIPE_SECRET_KEY is not configured, returns a mock payment URL
 * for development and testing purposes.
 */
export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
  const { quoteId, quoteNumber, amount, currency, customerEmail, customerName } = params;

  if (!amount || amount <= 0) {
    throw new Error('Le montant de l\'acompte doit être supérieur à 0');
  }

  // TODO: If no Stripe key is set, return mock URL for development
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  STRIPE_SECRET_KEY not configured - returning mock payment URL');
    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/quotes/${quoteId}?payment=mock`,
      sessionId: `mock_session_${quoteId}_${Date.now()}`,
    };
  }

  try {
    const stripe = getStripe();
    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Acompte - Devis ${quoteNumber}`,
              description: `Acompte pour le devis ${quoteNumber}`,
            },
            unit_amount: formatAmountForStripe(amount, currency),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/quotes/${quoteId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/quotes/${quoteId}?payment=cancelled`,
      customer_email: customerEmail || undefined,
      metadata: {
        quoteId,
        quoteNumber,
        customerName: customerName || '',
      },
    });

    if (!session.url) {
      throw new Error('Impossible de créer le lien de paiement');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    throw new Error('Erreur lors de la création du lien de paiement Stripe');
  }
}

/**
 * Format amount for Stripe (convert euros to cents)
 */
export function formatAmountForStripe(amount: number, currency: string = 'eur'): number {
  const numberFormat = new Intl.NumberFormat(['fr-FR'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert cents to euros)
 */
export function formatAmountFromStripe(amount: number, currency: string = 'eur'): number {
  const numberFormat = new Intl.NumberFormat(['fr-FR'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : amount / 100;
}
