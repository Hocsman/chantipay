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
    const body = await request.json()
    const { recipientEmail, message } = body

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

    // Récupérer les infos de l'entreprise (depuis le profil utilisateur)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, company_address, company_phone, company_email, company_siret')
      .eq('id', user.id)
      .single()

    const companyInfo = {
      name: profile?.company_name || 'ChantiPay',
      address: profile?.company_address || '123 Avenue Exemple, 75001 Paris',
      phone: profile?.company_phone || '+33 1 23 45 67 89',
      email: profile?.company_email || 'contact@chantipay.fr',
      siret: profile?.company_siret || '123 456 789 00012',
    }

    // Générer le PDF avec @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      InvoicePdfDocument({
        invoice: {
          ...invoice,
          items: invoice.items || [],
        },
        companyInfo,
      })
    )

    // Vérifier que Resend est configuré
    const resendClient = getResend()
    if (!resendClient) {
      return NextResponse.json(
        { error: 'Service d\'email non configuré. Veuillez configurer RESEND_API_KEY.' },
        { status: 503 }
      )
    }

    // Envoyer l'email avec Resend
    const { data: emailData, error: emailError } = await resendClient.emails.send({
      from: 'ChantiPay <onboarding@resend.dev>', // Remplacer par votre domaine vérifié
      to: [toEmail],
      subject: `Facture ${invoice.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Facture ${invoice.invoice_number}</h1>
          
          <p>Bonjour ${invoice.client_name},</p>
          
          ${message ? `<p>${message}</p>` : `
            <p>Veuillez trouver ci-joint votre facture d'un montant de <strong>${invoice.total.toFixed(2)} €</strong>.</p>
          `}
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Détails de la facture</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Numéro:</strong> ${invoice.invoice_number}</li>
              <li><strong>Date d'émission:</strong> ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</li>
              ${invoice.due_date ? `<li><strong>Date d'échéance:</strong> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</li>` : ''}
              <li><strong>Montant total:</strong> ${invoice.total.toFixed(2)} €</li>
            </ul>
          </div>
          
          <p>Merci de votre confiance.</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #6B7280; font-size: 12px;">
            ${companyInfo.name}<br>
            ${companyInfo.address}<br>
            ${companyInfo.phone} - ${companyInfo.email}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (emailError) {
      console.error('Erreur envoi email:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
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
