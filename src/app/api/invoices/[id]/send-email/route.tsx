import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdfDocument } from '@/lib/pdf/InvoicePdfServer'

// Initialisation lazy de Resend pour éviter les erreurs au build
let resend: Resend | null = null
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

/**
 * ===========================================
 * Send Invoice Email API Route
 * ===========================================
 * POST /api/invoices/[id]/send-email
 *
 * Envoie la facture par email au client avec le PDF en pièce jointe
 *
 * Request Body:
 * {
 *   recipientEmail?: string;  // Optionnel: email de destination (sinon utilise client_email de la facture)
 *   message?: string;         // Optionnel: message personnalisé
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   message: string;
 * }
 *
 * Status Codes:
 * - 200: Success - email envoyé
 * - 400: Bad request (missing email)
 * - 404: Invoice not found
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const supabase = await createClient()
    let recipientEmail: string | undefined
    let message: string | undefined
    try {
      const body = await request.json()
      recipientEmail = body.recipientEmail
      message = body.message
    } catch {
      // Body vide ou invalide - on continue avec les valeurs par défaut
    }

    // Récupérer l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer la facture avec ses items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      )
    }

    // Déterminer l'email de destination
    const toEmail = recipientEmail || invoice.client_email

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Aucun email de destination' },
        { status: 400 }
      )
    }

    // Vérifier que Resend est configuré AVANT de générer le PDF
    const resendClient = getResend()
    if (!resendClient) {
      console.error('❌ RESEND_API_KEY non configurée')
      return NextResponse.json(
        {
          error: 'Service d\'email non configuré',
          details: 'La clé API Resend n\'est pas configurée. Veuillez ajouter RESEND_API_KEY dans vos variables d\'environnement.',
          code: 'RESEND_NOT_CONFIGURED'
        },
        { status: 503 }
      )
    }

    // Récupérer les infos de l'entreprise (depuis le profil utilisateur)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, full_name, address, phone, email, siret')
      .eq('id', user.id)
      .single()

    const companyInfo = {
      name: profile?.company_name || profile?.full_name || 'Mon Entreprise',
      address: profile?.address || '',
      phone: profile?.phone || '',
      email: profile?.email || user.email || '',
      siret: profile?.siret || '',
    }

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      <InvoicePdfDocument
        invoice={{
          ...invoice,
          items: invoice.items || [],
        }}
        companyInfo={companyInfo}
      />
    )

    // Envoyer l'email avec Resend
    let emailData
    let emailError

    try {
      const result = await resendClient.emails.send({
        from: 'ChantiPay Factures <factures@chantipay.com>',
        replyTo: 'contact@chantipay.com',
        to: [toEmail],
        subject: `Facture ${invoice.invoice_number} - ${companyInfo.name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">📄 Facture</h1>
              <p style="color: #DBEAFE; margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${invoice.invoice_number}</p>
            </div>

            <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">Bonjour <strong>${invoice.client_name}</strong>,</p>

              ${message ? `<p style="font-size: 14px; color: #6B7280; line-height: 1.6;">${message}</p>` : `
                <p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
                  Veuillez trouver ci-joint votre facture d'un montant de <strong style="color: #2563EB;">${invoice.total.toFixed(2)} €</strong>.
                </p>
              `}

              <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563EB;">
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #374151;">📋 Détails de la facture</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #6B7280;">Numéro</td>
                    <td style="padding: 6px 0; color: #111827; font-weight: 600; text-align: right;">${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6B7280;">Date d'émission</td>
                    <td style="padding: 6px 0; color: #111827; font-weight: 600; text-align: right;">${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</td>
                  </tr>
                  ${invoice.due_date ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6B7280;">Date d'échéance</td>
                    <td style="padding: 6px 0; color: #F59E0B; font-weight: 600; text-align: right;">${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 12px 0 6px 0; color: #6B7280; border-top: 1px solid #E5E7EB;">Montant total TTC</td>
                    <td style="padding: 12px 0 6px 0; color: #2563EB; font-weight: 700; text-align: right; font-size: 18px; border-top: 1px solid #E5E7EB;">${invoice.total.toFixed(2)} €</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
                Le PDF de la facture est joint à cet email. N'hésitez pas à nous contacter pour toute question.
              </p>

              <p style="font-size: 14px; color: #374151; margin-top: 25px;">
                Cordialement,<br>
                <strong>${companyInfo.name}</strong>
              </p>

              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">

              <div style="font-size: 12px; color: #9CA3AF; line-height: 1.5;">
                <strong style="color: #6B7280;">${companyInfo.name}</strong><br>
                ${companyInfo.address ? `${companyInfo.address}<br>` : ''}
                ${companyInfo.phone ? `📞 ${companyInfo.phone} ` : ''}
                ${companyInfo.email ? `• ✉️ ${companyInfo.email}` : ''}<br>
                ${companyInfo.siret ? `SIRET: ${companyInfo.siret}` : ''}
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Facture_${invoice.invoice_number}.pdf`,
            content: pdfBuffer,
          },
        ],
      })

      emailData = result.data
      emailError = result.error
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi email Resend:', error)
      emailError = error
    }

    if (emailError) {
      console.error('❌ Erreur envoi email:', emailError)

      // Message d'erreur détaillé selon le type
      let errorMessage = 'Erreur lors de l\'envoi de l\'email'
      let errorDetails = ''

      if (typeof emailError === 'object' && emailError !== null) {
        const err = emailError as any
        if (err.message) {
          errorDetails = err.message
        }
        if (err.statusCode === 429) {
          errorMessage = 'Limite d\'envoi atteinte'
          errorDetails = 'Trop d\'emails envoyés. Veuillez réessayer dans quelques minutes.'
        } else if (err.statusCode === 422) {
          errorMessage = 'Email invalide'
          errorDetails = 'L\'adresse email du destinataire est invalide.'
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails || 'Une erreur est survenue lors de l\'envoi. Vérifiez votre configuration Resend.',
          code: 'EMAIL_SEND_FAILED'
        },
        { status: 500 }
      )
    }

    // Mettre à jour la facture (marquer comme envoyée si en brouillon)
    if (invoice.payment_status === 'draft') {
      await supabase
        .from('invoices')
        .update({
          payment_status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
    } else if (!invoice.sent_at) {
      await supabase
        .from('invoices')
        .update({
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
    }

    return NextResponse.json({
      success: true,
      message: `Email envoyé à ${toEmail}`,
      emailId: emailData?.id,
    })
  } catch (error) {
    console.error('Erreur send-email invoice:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
