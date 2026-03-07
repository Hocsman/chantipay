import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications'

/**
 * ===========================================
 * Quote Signature API Route
 * ===========================================
 * POST /api/quotes/[id]/sign
 *
 * Handles electronic signature of quotes by clients.
 * Uploads signature image to Supabase Storage and updates quote status to 'signed'.
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
 * 2. Upload signature image to Supabase Storage (signatures bucket)
 * 3. Update quote: status='signed', signed_at=now, signature_image_url (public URL)
 *
 * TODO: Add client authentication via temporary token (for unsigned clients)
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

    // Uploader la signature dans Supabase Storage
    const signatureUrl = await uploadSignatureToStorage(signature, quoteId)

    // Mettre à jour le devis
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature_image_url: signatureUrl,
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

    // Créer une notification
    await createNotification(supabase, {
      userId: quote.user_id,
      type: 'quote_signed',
      title: `Devis ${quote.quote_number} signé`,
      message: `Le client a signé le devis`,
      relatedType: 'quote',
      relatedId: quoteId,
    })

    return NextResponse.json({
      success: true,
      message: 'Devis signé avec succès',
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Erreur signature:', errMsg, error)
    return NextResponse.json(
      { error: `Erreur lors de la signature du devis: ${errMsg}` },
      { status: 500 }
    )
  }
}

async function uploadSignatureToStorage(
  signatureDataUrl: string,
  quoteId: string
): Promise<string> {
  // Extraire le type mime et les données base64
  const matches = signatureDataUrl.match(/^data:([^;]+);base64,(.+)$/)

  let mimeType = 'image/png'
  let base64Data = signatureDataUrl

  if (matches) {
    mimeType = matches[1]
    base64Data = matches[2]
  }

  const extension = mimeType.split('/')[1] || 'png'
  const fileName = `${quoteId}/${Date.now()}.${extension}`
  const buffer = Buffer.from(base64Data, 'base64')

  // Utiliser le service client pour bypasser RLS (le signataire peut ne pas être authentifié)
  const serviceClient = createServiceClient()

  const { error: uploadError } = await serviceClient.storage
    .from('signatures')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Erreur upload signature: ${uploadError.message}`)
  }

  const { data: urlData } = serviceClient.storage
    .from('signatures')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}
