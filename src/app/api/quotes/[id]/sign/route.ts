import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * ===========================================
 * Quote Signature API Route
 * ===========================================
 * POST /api/quotes/[id]/sign
 *
 * Handles electronic signature of quotes by clients.
 * Stores signature image and updates quote status to 'signed'.
 *
 * Request Body:
 * {
 *   signature: string;  // Required: Base64-encoded signature image or data URL
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 *
 * Status Codes:
 * - 200: Success - quote signed
 * - 400: Bad request (missing signature or quote can't be signed)
 * - 404: Quote not found
 * - 500: Server error
 *
 * Business Logic:
 * 1. Verify quote exists and is in signable state (draft/sent)
 * 2. Accept signature data (base64 image or data URL)
 * 3. Update quote: status='signed', signed_at=now, signature_image_url
 *
 * TODO: Implement upload to Supabase Storage instead of storing data URL
 * TODO: Add client authentication via temporary token (for unsigned clients)
 * TODO: Validate signature image format and size
 * TODO: Add signature verification/validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params
    
    const body = await request.json()
    const { signature } = body

    if (!signature || typeof signature !== 'string') {
      return NextResponse.json(
        { error: 'La signature est requise' },
        { status: 400 }
      )
    }

    // Mode démo si Supabase n'est pas configuré
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log(`[DEMO] Signature enregistrée pour le devis ${quoteId}`)
      return NextResponse.json({
        success: true,
        message: 'Devis signé avec succès (mode démo)',
        demo: true,
      })
    }

    const supabase = await createClient()

    // Vérifier que le devis existe
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le devis peut être signé
    if (!['draft', 'sent'].includes(quote.status)) {
      return NextResponse.json(
        { error: 'Ce devis ne peut plus être signé' },
        { status: 400 }
      )
    }

    // TODO: Sauvegarder l'image de signature dans Supabase Storage
    // Pour l'instant, on stocke le data URL directement (à optimiser)
    // const signatureUrl = await uploadSignatureToStorage(signature, quoteId)

    // Mettre à jour le devis
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_image_url: signature, // TODO: remplacer par l'URL du storage
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)

    if (updateError) {
      console.error('Erreur mise à jour devis:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du devis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Devis signé avec succès',
    })
  } catch (error) {
    console.error('Erreur signature:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la signature du devis' },
      { status: 500 }
    )
  }
}

// TODO: Implémenter l'upload vers Supabase Storage
// async function uploadSignatureToStorage(
//   signatureDataUrl: string, 
//   quoteId: string
// ): Promise<string> {
//   // Convertir le data URL en blob
//   // Uploader vers Supabase Storage
//   // Retourner l'URL publique
// }
