import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  // Lazy initialization de Resend pour éviter les erreurs au build
  const resend = new Resend(process.env.RESEND_API_KEY || '')

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Récupérer le devis avec les items
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (
        name,
        email
      ),
      items:quote_items (
        description,
        quantity,
        unit_price_ht,
        vat_rate
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
  }

  // Vérifier que le client a un email
  if (!quote.clients?.email) {
    return NextResponse.json(
      { error: 'Le client n\'a pas d\'adresse email' },
      { status: 400 }
    )
  }

  try {
    // Calcul des totaux
    const items = quote.items || []
    const totalHT = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price_ht,
      0
    )
    const totalTVA = items.reduce(
      (sum: number, item: any) =>
        sum + item.quantity * item.unit_price_ht * (item.vat_rate / 100),
      0
    )
    const totalTTC = totalHT + totalTVA

    // Envoi de l'email
    const { error: sendError } = await resend.emails.send({
      from: 'ChantiPay <noreply@chantipay.com>',
      to: quote.clients.email,
      subject: `Devis ${quote.quote_number} - ChantiPay`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9f9f9; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background: #f0f0f0; font-weight: bold; }
              .total { font-size: 18px; font-weight: bold; color: #3B82F6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Devis ${quote.quote_number}</h1>
              </div>
              <div class="content">
                <p>Bonjour ${quote.clients.name},</p>
                <p>Veuillez trouver ci-dessous votre devis.</p>
                
                <table>
                  <thead>
                    <tr>
                      <th>Prestation</th>
                      <th>Qté</th>
                      <th>Prix HT</th>
                      <th>Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map(
                        (item: any) => `
                      <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit_price_ht.toFixed(2)} €</td>
                        <td>${(item.quantity * item.unit_price_ht).toFixed(2)} €</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" style="text-align: right;"><strong>Total HT</strong></td>
                      <td><strong>${totalHT.toFixed(2)} €</strong></td>
                    </tr>
                    <tr>
                      <td colspan="3" style="text-align: right;">TVA (20%)</td>
                      <td>${totalTVA.toFixed(2)} €</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="text-align: right;"><strong>Total TTC</strong></td>
                      <td class="total">${totalTTC.toFixed(2)} €</td>
                    </tr>
                  </tfoot>
                </table>

                <p>Pour consulter et signer votre devis en ligne :</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quote.id}" class="button">
                  Voir le devis
                </a>

                <p>Merci pour votre confiance.</p>
              </div>
              <div class="footer">
                <p>ChantiPay - Gestion de devis et factures pour artisans</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (sendError) {
      console.error('Erreur envoi email:', sendError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    // Mettre à jour le statut du devis à "sent" et ajouter la date d'envoi
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Erreur mise à jour devis:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du devis' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email envoyé avec succès',
    })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
