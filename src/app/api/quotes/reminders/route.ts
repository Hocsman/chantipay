import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

/**
 * GET /api/quotes/reminders
 * Récupère les devis à relancer et les statistiques de relance
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les paramètres de relance
    const { data: settings } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Récupérer les devis envoyés non signés avec leur nombre de relances
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        total_ttc,
        sent_at,
        status,
        clients (
          name,
          email
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: true })

    if (quotesError) {
      console.error('Erreur récupération devis:', quotesError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Filtrer les devis sans email client
    const quotesWithEmail = quotes?.filter(q => (q.clients as any)?.email) || []

    // Récupérer le nombre de relances par devis
    const { data: reminders } = await supabase
      .from('quote_reminders')
      .select('quote_id')
      .eq('user_id', user.id)

    const reminderCounts: Record<string, number> = {}
    reminders?.forEach(r => {
      reminderCounts[r.quote_id] = (reminderCounts[r.quote_id] || 0) + 1
    })

    // Paramètres par défaut
    const reminderSettings = {
      enabled: settings?.enabled ?? true,
      firstReminderDays: settings?.first_reminder_days ?? 2,
      secondReminderDays: settings?.second_reminder_days ?? 7,
      thirdReminderDays: settings?.third_reminder_days ?? 14,
      maxReminders: settings?.max_reminders ?? 3,
      customMessage: settings?.custom_message ?? null,
    }

    // Enrichir les devis avec les infos de relance
    const now = new Date()
    const quotesWithReminders = quotesWithEmail.map(quote => {
      const sentAt = new Date(quote.sent_at)
      const daysSinceSent = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24))
      const reminderCount = reminderCounts[quote.id] || 0

      let nextReminderDue = false
      let nextReminderIn: number | null = null

      if (reminderCount < reminderSettings.maxReminders) {
        const thresholds = [
          reminderSettings.firstReminderDays,
          reminderSettings.secondReminderDays,
          reminderSettings.thirdReminderDays,
        ]
        const nextThreshold = thresholds[reminderCount]
        if (nextThreshold) {
          if (daysSinceSent >= nextThreshold) {
            nextReminderDue = true
          } else {
            nextReminderIn = nextThreshold - daysSinceSent
          }
        }
      }

      return {
        id: quote.id,
        quote_number: quote.quote_number,
        client_name: (quote.clients as any)?.name || 'Client',
        client_email: (quote.clients as any)?.email,
        total_ttc: quote.total_ttc,
        sent_at: quote.sent_at,
        daysSinceSent,
        reminderCount,
        nextReminderDue,
        nextReminderIn,
        canRemind: reminderCount < reminderSettings.maxReminders,
      }
    })

    // Statistiques
    const stats = {
      totalPending: quotesWithReminders.length,
      readyForReminder: quotesWithReminders.filter(q => q.nextReminderDue).length,
      totalReminders: reminders?.length || 0,
    }

    return NextResponse.json({
      quotes: quotesWithReminders,
      settings: reminderSettings,
      stats,
    })
  } catch (error) {
    console.error('Erreur GET /api/quotes/reminders:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/quotes/reminders
 * Envoie une relance pour un ou plusieurs devis
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { quoteIds } = body

    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json({ error: 'Liste de devis requise' }, { status: 400 })
    }

    // Récupérer les paramètres de relance
    const { data: settings } = await supabase
      .from('reminder_settings')
      .select('custom_message')
      .eq('user_id', user.id)
      .single()

    // Récupérer les profil utilisateur pour les infos de l'entreprise
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, email')
      .eq('id', user.id)
      .single()

    // Récupérer les devis à relancer avec les infos client
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_number,
        total_ttc,
        sent_at,
        clients (
          name,
          email
        )
      `)
      .in('id', quoteIds)
      .eq('user_id', user.id)
      .eq('status', 'sent')

    if (quotesError) {
      console.error('Erreur récupération devis:', quotesError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ error: 'Devis non trouvés ou non éligibles à la relance' }, { status: 404 })
    }

    // Récupérer le nombre de relances existantes pour chaque devis
    const { data: existingReminders } = await supabase
      .from('quote_reminders')
      .select('quote_id')
      .in('quote_id', quoteIds)

    const reminderCounts: Record<string, number> = {}
    existingReminders?.forEach(r => {
      reminderCounts[r.quote_id] = (reminderCounts[r.quote_id] || 0) + 1
    })

    // Initialiser Resend
    const resend = new Resend(process.env.RESEND_API_KEY || '')

    const results: { quoteId: string; success: boolean; error?: string }[] = []

    for (const quote of quotes) {
      const clientEmail = (quote.clients as any)?.email
      const clientName = (quote.clients as any)?.name || 'Client'

      if (!clientEmail) {
        results.push({ quoteId: quote.id, success: false, error: 'Pas d\'email client' })
        continue
      }

      const reminderNumber = (reminderCounts[quote.id] || 0) + 1
      const companyName = profile?.company_name || 'ChantiPay'

      try {
        // Construire le message de relance
        const customMessage = settings?.custom_message || null
        const defaultMessage = reminderNumber === 1
          ? `Nous nous permettons de vous relancer concernant notre devis du ${new Date(quote.sent_at).toLocaleDateString('fr-FR')}.`
          : reminderNumber === 2
            ? `Suite à notre précédent message, nous souhaitons savoir si vous avez pu étudier notre devis.`
            : `Nous restons à votre disposition pour toute question concernant notre devis.`

        const { error: sendError } = await resend.emails.send({
          from: `${companyName} <devis@chantipay.com>`,
          replyTo: profile?.email || 'contact@chantipay.com',
          to: clientEmail,
          subject: `Relance - Devis ${quote.quote_number}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { padding: 25px; background: #ffffff; border: 1px solid #e5e7eb; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; border-radius: 0 0 10px 10px; }
                  .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                  .highlight { background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0; }
                  .amount { font-size: 24px; font-weight: bold; color: #3B82F6; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">Rappel - Devis ${quote.quote_number}</h1>
                  </div>
                  <div class="content">
                    <p>Bonjour ${clientName},</p>

                    <p>${customMessage || defaultMessage}</p>

                    <div class="highlight">
                      <p style="margin: 0;"><strong>Devis n° ${quote.quote_number}</strong></p>
                      <p class="amount" style="margin: 10px 0 0 0;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.total_ttc)} TTC</p>
                    </div>

                    <p>Vous pouvez consulter et signer votre devis en ligne en cliquant sur le bouton ci-dessous :</p>

                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quote.id}" class="button">
                        Voir et signer le devis
                      </a>
                    </div>

                    <p>N'hésitez pas à nous contacter pour toute question.</p>

                    <p>Cordialement,<br><strong>${companyName}</strong></p>
                  </div>
                  <div class="footer">
                    <p>Ce message est une relance automatique (${reminderNumber}/3)</p>
                    <p>ChantiPay - Gestion de devis et factures pour artisans</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })

        if (sendError) {
          console.error('Erreur envoi relance:', sendError)
          results.push({ quoteId: quote.id, success: false, error: 'Erreur envoi email' })
          continue
        }

        // Enregistrer la relance
        await supabase.from('quote_reminders').insert({
          quote_id: quote.id,
          user_id: user.id,
          reminder_number: reminderNumber,
          email_sent_to: clientEmail,
        })

        results.push({ quoteId: quote.id, success: true })
      } catch (err) {
        console.error('Erreur relance devis:', err)
        results.push({ quoteId: quote.id, success: false, error: 'Erreur serveur' })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failCount === 0,
      message: `${successCount} relance(s) envoyée(s)${failCount > 0 ? `, ${failCount} échec(s)` : ''}`,
      results,
    })
  } catch (error) {
    console.error('Erreur POST /api/quotes/reminders:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
