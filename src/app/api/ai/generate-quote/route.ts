import { NextRequest, NextResponse } from 'next/server'
import { generateQuoteItems } from '@/lib/openai'

/**
 * ===========================================
 * AI Quote Generation API Route
 * ===========================================
 * POST /api/ai/generate-quote
 *
 * Generates quote line items from a job description using OpenAI.
 * If OPENAI_API_KEY is not configured, returns mock data for development.
 *
 * Request Body:
 * {
 *   description: string;  // Required: Description of the work to be done
 *   trade?: string;       // Optional: Type of trade (plumber, electrician, etc.)
 * }
 *
 * Response:
 * {
 *   items: Array<{
 *     description: string;
 *     quantity: number;
 *     unit_price_ht: number;
 *     vat_rate: number;
 *   }>
 * }
 *
 * Status Codes:
 * - 200: Success
 * - 400: Invalid input (missing or invalid description)
 * - 500: Server error (AI generation failed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, trade } = body

    // Validate required input
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "description" est requis' },
        { status: 400 }
      )
    }

    // Validate optional trade parameter
    if (trade && typeof trade !== 'string') {
      return NextResponse.json(
        { error: 'Le champ "trade" doit être une chaîne de caractères' },
        { status: 400 }
      )
    }

    // Generate quote items using AI (or mock data if API key not configured)
    // TODO: Add rate limiting to prevent abuse
    // TODO: Add user authentication to track usage per user
    const items = await generateQuoteItems(description, trade)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('❌ Erreur génération IA:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du devis' },
      { status: 500 }
    )
  }
}
