import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

/**
 * POST /api/cron/send-reminders
 * Route CRON appelée par GitHub Actions pour envoyer les relances automatiques.
 * Parcourt tous les utilisateurs ayant activé les relances et envoie les emails éligibles.
 *
 * Authentification : Header Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification CRON
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Client Supabase admin (bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resend = new Resend(process.env.RESEND_API_KEY || '')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.chantipay.com'
    const now = new Date()

    let quotesReminded = 0
    let invoicesReminded = 0
    const errors: string[] = []

    // ============================================
    // PARTIE 1 : Relances devis
    // ============================================

    // Récupérer les settings de relance devis (tous utilisateurs avec enabled=true)
    const { data: quoteSettings } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('enabled', true)

    // Récupérer aussi les utilisateurs sans settings (defaults activés)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, company_name, email')

    const profileMap: Record<string, { company_name: string | null; email: string | null }> = {}
    allProfiles?.forEach(p => {
      profileMap[p.id] = { company_name: p.company_name, email: p.email }
    })

    // Set des user_ids avec settings explicites
    const usersWithQuoteSettings = new Set(quoteSettings?.map(s => s.user_id) || [])

    // Récupérer TOUS les devis envoyés non signés
    const { data: sentQuotes } = await supabase
      .from('quotes')
      .select(`
        id, user_id, quote_number, total_ttc, sent_at,
        clients ( name, email )
      `)
      .eq('status', 'sent')
      .not('sent_at', 'is', null)

    if (sentQuotes && sentQuotes.length > 0) {
      // Récupérer toutes les relances existantes
      const quoteIds = sentQuotes.map(q => q.id)
      const { data: existingQuoteReminders } = await supabase
        .from('quote_reminders')
        .select('quote_id')
        .in('quote_id', quoteIds)

      const quoteReminderCounts: Record<string, number> = {}
      existingQuoteReminders?.forEach(r => {
        quoteReminderCounts[r.quote_id] = (quoteReminderCounts[r.quote_id] || 0) + 1
      })

      for (const quote of sentQuotes) {
        const clientEmail = (quote.clients as any)?.email
        const clientName = (quote.clients as any)?.name || 'Client'

        if (!clientEmail) continue

        // Settings de cet utilisateur
        const userSettings = quoteSettings?.find(s => s.user_id === quote.user_id)

        // Si l'utilisateur a explicitement désactivé les relances, skip
        if (usersWithQuoteSettings.has(quote.user_id) && !userSettings) continue

        const firstDays = userSettings?.first_reminder_days ?? 2
        const secondDays = userSettings?.second_reminder_days ?? 7
        const thirdDays = userSettings?.third_reminder_days ?? 14
        const maxReminders = userSettings?.max_reminders ?? 3
        const customMessage = userSettings?.custom_message || null

        const sentAt = new Date(quote.sent_at)
        const daysSinceSent = Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24))
        const reminderCount = quoteReminderCounts[quote.id] || 0

        if (reminderCount >= maxReminders) continue

        // Vérifier si une relance est due
        const thresholds = [firstDays, secondDays, thirdDays]
        const nextThreshold = thresholds[reminderCount]
        if (!nextThreshold || daysSinceSent < nextThreshold) continue

        // Envoyer la relance
        const profile = profileMap[quote.user_id]
        const companyName = profile?.company_name || 'ChantiPay'
        const reminderNumber = reminderCount + 1

        const defaultMessage = reminderNumber === 1
          ? `Nous nous permettons de vous relancer concernant notre devis du ${sentAt.toLocaleDateString('fr-FR')}.`
          : reminderNumber === 2
            ? `Suite à notre précédent message, nous souhaitons savoir si vous avez pu étudier notre devis.`
            : `Nous restons à votre disposition pour toute question concernant notre devis.`

        try {
          const { error: sendError } = await resend.emails.send({
            from: `${companyName} <devis@chantipay.com>`,
            replyTo: profile?.email || 'contact@chantipay.com',
            to: clientEmail,
            subject: `Relance - Devis ${quote.quote_number}`,
            html: buildQuoteReminderHtml({
              clientName,
              message: customMessage || defaultMessage,
              quoteNumber: quote.quote_number,
              totalTtc: quote.total_ttc,
              quoteUrl: `${appUrl}/quotes/${quote.id}`,
              companyName,
              reminderNumber,
            }),
          })

          if (sendError) {
            errors.push(`Devis ${quote.quote_number}: ${sendError.message}`)
            continue
          }

          await supabase.from('quote_reminders').insert({
            quote_id: quote.id,
            user_id: quote.user_id,
            reminder_number: reminderNumber,
            email_sent_to: clientEmail,
          })

          quotesReminded++
        } catch (err) {
          errors.push(`Devis ${quote.quote_number}: ${err instanceof Error ? err.message : 'Erreur'}`)
        }
      }
    }

    // ============================================
    // PARTIE 2 : Relances factures
    // ============================================

    const { data: invoiceSettings } = await supabase
      .from('invoice_reminder_settings')
      .select('*')
      .eq('enabled', true)

    const usersWithInvoiceSettings = new Set(invoiceSettings?.map(s => s.user_id) || [])

    // Récupérer les factures impayées avec échéance dépassée
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select(`
        id, user_id, invoice_number, total, issue_date, due_date,
        client_name, client_email
      `)
      .in('payment_status', ['sent', 'overdue', 'partial'])
      .not('due_date', 'is', null)

    if (overdueInvoices && overdueInvoices.length > 0) {
      // Filtrer celles qui sont réellement en retard
      const actuallyOverdue = overdueInvoices.filter(inv => {
        const dueDate = new Date(inv.due_date)
        return now.getTime() > dueDate.getTime()
      })

      if (actuallyOverdue.length > 0) {
        const invoiceIds = actuallyOverdue.map(inv => inv.id)
        const { data: existingInvoiceReminders } = await supabase
          .from('invoice_reminders')
          .select('invoice_id')
          .in('invoice_id', invoiceIds)

        const invoiceReminderCounts: Record<string, number> = {}
        existingInvoiceReminders?.forEach(r => {
          invoiceReminderCounts[r.invoice_id] = (invoiceReminderCounts[r.invoice_id] || 0) + 1
        })

        for (const invoice of actuallyOverdue) {
          if (!invoice.client_email) continue

          const userSettings = invoiceSettings?.find(s => s.user_id === invoice.user_id)
          if (usersWithInvoiceSettings.has(invoice.user_id) && !userSettings) continue

          const firstDays = userSettings?.first_reminder_days ?? 7
          const secondDays = userSettings?.second_reminder_days ?? 14
          const thirdDays = userSettings?.third_reminder_days ?? 30
          const maxReminders = userSettings?.max_reminders ?? 3
          const customMessage = userSettings?.custom_message || null
          const latePaymentRate = userSettings?.late_payment_rate ?? 10.57
          const recoveryFee = userSettings?.recovery_fee ?? 40.00

          const dueDate = new Date(invoice.due_date)
          const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          const reminderCount = invoiceReminderCounts[invoice.id] || 0

          if (reminderCount >= maxReminders) continue

          const thresholds = [firstDays, secondDays, thirdDays]
          const nextThreshold = thresholds[reminderCount]
          if (!nextThreshold || daysPastDue < nextThreshold) continue

          const profile = profileMap[invoice.user_id]
          const companyName = profile?.company_name || 'ChantiPay'
          const reminderNumber = reminderCount + 1
          const dueDateStr = dueDate.toLocaleDateString('fr-FR')
          const issueDateStr = invoice.issue_date
            ? new Date(invoice.issue_date).toLocaleDateString('fr-FR')
            : 'N/A'

          const defaultMessage = reminderNumber === 1
            ? `Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture ci-dessous, arrivée à échéance le ${dueDateStr}.`
            : reminderNumber === 2
              ? `Malgré notre précédent rappel, nous constatons que la facture ci-dessous demeure impayée.`
              : `Nous nous permettons de vous adresser un dernier rappel concernant la facture suivante.`

          try {
            const { error: sendError } = await resend.emails.send({
              from: `${companyName} <factures@chantipay.com>`,
              replyTo: profile?.email || 'contact@chantipay.com',
              to: invoice.client_email,
              subject: `Rappel de paiement - Facture ${invoice.invoice_number}`,
              html: buildInvoiceReminderHtml({
                clientName: invoice.client_name || 'Client',
                message: customMessage || defaultMessage,
                invoiceNumber: invoice.invoice_number,
                totalTtc: invoice.total,
                issueDateStr,
                dueDateStr,
                daysPastDue,
                invoiceUrl: `${appUrl}/invoices/${invoice.id}`,
                companyName,
                reminderNumber,
                latePaymentRate,
                recoveryFee,
              }),
            })

            if (sendError) {
              errors.push(`Facture ${invoice.invoice_number}: ${sendError.message}`)
              continue
            }

            await supabase.from('invoice_reminders').insert({
              invoice_id: invoice.id,
              user_id: invoice.user_id,
              reminder_number: reminderNumber,
              email_sent_to: invoice.client_email,
            })

            invoicesReminded++
          } catch (err) {
            errors.push(`Facture ${invoice.invoice_number}: ${err instanceof Error ? err.message : 'Erreur'}`)
          }
        }
      }
    }

    console.log(`[CRON] Relances envoyées: ${quotesReminded} devis, ${invoicesReminded} factures, ${errors.length} erreurs`)

    return NextResponse.json({
      success: true,
      quotesReminded,
      invoicesReminded,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[CRON] Erreur send-reminders:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

// ============================================
// Templates HTML email
// ============================================

function buildQuoteReminderHtml(params: {
  clientName: string
  message: string
  quoteNumber: string
  totalTtc: number
  quoteUrl: string
  companyName: string
  reminderNumber: number
}) {
  const formattedTotal = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.totalTtc)

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8">
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
        <h1 style="margin: 0;">Rappel - Devis ${params.quoteNumber}</h1>
      </div>
      <div class="content">
        <p>Bonjour ${params.clientName},</p>
        <p>${params.message}</p>
        <div class="highlight">
          <p style="margin: 0;"><strong>Devis n° ${params.quoteNumber}</strong></p>
          <p class="amount" style="margin: 10px 0 0 0;">${formattedTotal} TTC</p>
        </div>
        <p>Vous pouvez consulter et signer votre devis en ligne en cliquant sur le bouton ci-dessous :</p>
        <div style="text-align: center;">
          <a href="${params.quoteUrl}" class="button">Voir et signer le devis</a>
        </div>
        <p>N'hésitez pas à nous contacter pour toute question.</p>
        <p>Cordialement,<br><strong>${params.companyName}</strong></p>
      </div>
      <div class="footer">
        <p>Ce message est une relance automatique (${params.reminderNumber}/3)</p>
        <p>ChantiPay - Gestion de devis et factures pour artisans</p>
      </div>
    </div>
  </body>
</html>`
}

function buildInvoiceReminderHtml(params: {
  clientName: string
  message: string
  invoiceNumber: string
  totalTtc: number
  issueDateStr: string
  dueDateStr: string
  daysPastDue: number
  invoiceUrl: string
  companyName: string
  reminderNumber: number
  latePaymentRate: number
  recoveryFee: number
}) {
  const formattedTotal = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.totalTtc)
  const formattedFee = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(params.recoveryFee)

  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #DC2626, #EA580C); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { padding: 25px; background: #ffffff; border: 1px solid #e5e7eb; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f9fafb; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #DC2626, #EA580C); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
      .highlight { background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #DC2626; margin: 20px 0; }
      .amount { font-size: 24px; font-weight: bold; color: #DC2626; }
      .legal { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 11px; color: #6b7280; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="margin: 0;">Rappel de paiement</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Facture ${params.invoiceNumber}</p>
      </div>
      <div class="content">
        <p>Bonjour ${params.clientName},</p>
        <p>${params.message}</p>
        <div class="highlight">
          <p style="margin: 0;"><strong>Facture n° ${params.invoiceNumber}</strong></p>
          <p style="margin: 5px 0;">Date d'émission : ${params.issueDateStr}</p>
          <p style="margin: 5px 0;">Date d'échéance : ${params.dueDateStr}</p>
          <p style="margin: 5px 0; color: #DC2626;"><strong>Retard : ${params.daysPastDue} jour(s)</strong></p>
          <p class="amount" style="margin: 10px 0 0 0;">${formattedTotal} TTC</p>
        </div>
        <p>Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.</p>
        <div style="text-align: center;">
          <a href="${params.invoiceUrl}" class="button">Voir la facture</a>
        </div>
        <p>Si vous avez déjà effectué le paiement, nous vous prions de ne pas tenir compte de ce message.</p>
        <p>Cordialement,<br><strong>${params.companyName}</strong></p>
        <div class="legal">
          <p style="margin: 0;"><strong>Mentions légales :</strong></p>
          <p style="margin: 5px 0 0 0;">
            Conformément à l'article L441-6 du Code de commerce, tout retard de paiement
            entraîne de plein droit des pénalités de retard calculées au taux de ${params.latePaymentRate}%
            (3 fois le taux d'intérêt légal), ainsi qu'une indemnité forfaitaire de
            ${formattedFee} pour frais de recouvrement.
          </p>
        </div>
      </div>
      <div class="footer">
        <p>Ce message est un rappel de paiement automatique (${params.reminderNumber}/3)</p>
        <p>ChantiPay - Gestion de devis et factures pour artisans</p>
      </div>
    </div>
  </body>
</html>`
}
