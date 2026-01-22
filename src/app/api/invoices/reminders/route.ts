import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

/**
 * GET /api/invoices/reminders
 * Récupère les factures à relancer et les statistiques de relance
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
            .from('invoice_reminder_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // Récupérer les factures envoyées non payées
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select(`
                id,
                invoice_number,
                total_ttc,
                total,
                issue_date,
                due_date,
                payment_status,
                client_name,
                client_email
            `)
            .eq('user_id', user.id)
            .in('payment_status', ['sent', 'overdue', 'partial'])
            .not('due_date', 'is', null)
            .order('due_date', { ascending: true })

        if (invoicesError) {
            console.error('Erreur récupération factures:', invoicesError)
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
        }

        // Filtrer les factures avec email client
        const invoicesWithEmail = invoices?.filter(inv => inv.client_email) || []

        // Récupérer le nombre de relances par facture
        const { data: reminders } = await supabase
            .from('invoice_reminders')
            .select('invoice_id')
            .eq('user_id', user.id)

        const reminderCounts: Record<string, number> = {}
        reminders?.forEach(r => {
            reminderCounts[r.invoice_id] = (reminderCounts[r.invoice_id] || 0) + 1
        })

        // Paramètres par défaut (jours après échéance)
        const reminderSettings = {
            enabled: settings?.enabled ?? true,
            firstReminderDays: settings?.first_reminder_days ?? 7,
            secondReminderDays: settings?.second_reminder_days ?? 14,
            thirdReminderDays: settings?.third_reminder_days ?? 30,
            maxReminders: settings?.max_reminders ?? 3,
            customMessage: settings?.custom_message ?? null,
            latePaymentRate: settings?.late_payment_rate ?? 10.57,
            recoveryFee: settings?.recovery_fee ?? 40.00,
        }

        // Enrichir les factures avec les infos de relance
        const now = new Date()
        const invoicesWithReminders = invoicesWithEmail.map(invoice => {
            const dueDate = new Date(invoice.due_date)
            const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            const reminderCount = reminderCounts[invoice.id] || 0

            let nextReminderDue = false
            let nextReminderIn: number | null = null

            // Calculer si relance due (basé sur jours après échéance)
            if (daysPastDue > 0 && reminderCount < reminderSettings.maxReminders) {
                const thresholds = [
                    reminderSettings.firstReminderDays,
                    reminderSettings.secondReminderDays,
                    reminderSettings.thirdReminderDays,
                ]
                const nextThreshold = thresholds[reminderCount]
                if (nextThreshold) {
                    if (daysPastDue >= nextThreshold) {
                        nextReminderDue = true
                    } else {
                        nextReminderIn = nextThreshold - daysPastDue
                    }
                }
            }

            return {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                client_name: invoice.client_name || 'Client',
                client_email: invoice.client_email,
                total_ttc: invoice.total_ttc || invoice.total,
                due_date: invoice.due_date,
                daysPastDue: Math.max(0, daysPastDue),
                reminderCount,
                nextReminderDue,
                nextReminderIn,
                canRemind: reminderCount < reminderSettings.maxReminders && daysPastDue > 0,
            }
        })

        // Statistiques
        const stats = {
            totalOverdue: invoicesWithReminders.filter(inv => inv.daysPastDue > 0).length,
            readyForReminder: invoicesWithReminders.filter(inv => inv.nextReminderDue).length,
            totalReminders: reminders?.length || 0,
        }

        return NextResponse.json({
            invoices: invoicesWithReminders,
            settings: reminderSettings,
            stats,
        })
    } catch (error) {
        console.error('Erreur GET /api/invoices/reminders:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

/**
 * POST /api/invoices/reminders
 * Envoie une relance pour une ou plusieurs factures
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const body = await request.json()
        const { invoiceIds } = body

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
            return NextResponse.json({ error: 'Liste de factures requise' }, { status: 400 })
        }

        // Récupérer les paramètres de relance
        const { data: settings } = await supabase
            .from('invoice_reminder_settings')
            .select('custom_message, late_payment_rate, recovery_fee')
            .eq('user_id', user.id)
            .single()

        // Récupérer le profil utilisateur
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_name, email')
            .eq('id', user.id)
            .single()

        // Récupérer les factures à relancer
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select(`
                id,
                invoice_number,
                total_ttc,
                total,
                issue_date,
                due_date,
                client_name,
                client_email
            `)
            .in('id', invoiceIds)
            .eq('user_id', user.id)
            .in('payment_status', ['sent', 'overdue', 'partial'])

        if (invoicesError) {
            console.error('Erreur récupération factures:', invoicesError)
            return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
        }

        if (!invoices || invoices.length === 0) {
            return NextResponse.json({ error: 'Factures non trouvées ou non éligibles' }, { status: 404 })
        }

        // Récupérer le nombre de relances existantes
        const { data: existingReminders, error: remindersError } = await supabase
            .from('invoice_reminders')
            .select('invoice_id')
            .in('invoice_id', invoiceIds)

        if (remindersError) {
            console.error('Erreur récupération relances:', remindersError)
            // Continue même si la table n'existe pas
        }

        const reminderCounts: Record<string, number> = {}
        existingReminders?.forEach(r => {
            reminderCounts[r.invoice_id] = (reminderCounts[r.invoice_id] || 0) + 1
        })

        // Initialiser Resend
        const resend = new Resend(process.env.RESEND_API_KEY || '')

        const results: { invoiceId: string; success: boolean; error?: string }[] = []
        const latePaymentRate = settings?.late_payment_rate ?? 10.57
        const recoveryFee = settings?.recovery_fee ?? 40.00

        for (const invoice of invoices) {
            const clientEmail = invoice.client_email
            const clientName = invoice.client_name || 'Client'

            if (!clientEmail) {
                results.push({ invoiceId: invoice.id, success: false, error: 'Pas d\'email client' })
                continue
            }

            const reminderNumber = (reminderCounts[invoice.id] || 0) + 1
            const companyName = profile?.company_name || 'ChantiPay'
            const dueDate = new Date(invoice.due_date)
            const daysPastDue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

            try {
                const customMessage = settings?.custom_message || null
                const defaultMessage = reminderNumber === 1
                    ? `Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture ci-dessous, arrivée à échéance le ${dueDate.toLocaleDateString('fr-FR')}.`
                    : reminderNumber === 2
                        ? `Malgré notre précédent rappel, nous constatons que la facture ci-dessous demeure impayée.`
                        : `Nous nous permettons de vous adresser un dernier rappel concernant la facture suivante.`

                const { error: sendError } = await resend.emails.send({
                    from: `${companyName} <factures@chantipay.com>`,
                    replyTo: profile?.email || 'contact@chantipay.com',
                    to: clientEmail,
                    subject: `Rappel de paiement - Facture ${invoice.invoice_number}`,
                    html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
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
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Facture ${invoice.invoice_number}</p>
                  </div>
                  <div class="content">
                    <p>Bonjour ${clientName},</p>

                    <p>${customMessage || defaultMessage}</p>

                    <div class="highlight">
                      <p style="margin: 0;"><strong>Facture n° ${invoice.invoice_number}</strong></p>
                      <p style="margin: 5px 0;">Date d'émission : ${new Date(invoice.issue_date).toLocaleDateString('fr-FR')}</p>
                      <p style="margin: 5px 0;">Date d'échéance : ${dueDate.toLocaleDateString('fr-FR')}</p>
                      <p style="margin: 5px 0; color: #DC2626;"><strong>Retard : ${daysPastDue} jour(s)</strong></p>
                      <p class="amount" style="margin: 10px 0 0 0;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(invoice.total_ttc || invoice.total)} TTC</p>
                    </div>

                    <p>Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.</p>

                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}" class="button">
                        Voir la facture
                      </a>
                    </div>

                    <p>Si vous avez déjà effectué le paiement, nous vous prions de ne pas tenir compte de ce message.</p>

                    <p>Cordialement,<br><strong>${companyName}</strong></p>

                    <div class="legal">
                      <p style="margin: 0;"><strong>Mentions légales :</strong></p>
                      <p style="margin: 5px 0 0 0;">
                        Conformément à l'article L441-6 du Code de commerce, tout retard de paiement 
                        entraîne de plein droit des pénalités de retard calculées au taux de ${latePaymentRate}% 
                        (3 fois le taux d'intérêt légal), ainsi qu'une indemnité forfaitaire de 
                        ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(recoveryFee)} 
                        pour frais de recouvrement.
                      </p>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Ce message est un rappel de paiement (${reminderNumber}/3)</p>
                    <p>ChantiPay - Gestion de devis et factures pour artisans</p>
                  </div>
                </div>
              </body>
            </html>
          `,
                })

                if (sendError) {
                    console.error('Erreur envoi relance facture:', sendError)
                    results.push({ invoiceId: invoice.id, success: false, error: 'Erreur envoi email' })
                    continue
                }

                // Enregistrer la relance
                const { error: insertError } = await supabase.from('invoice_reminders').insert({
                    invoice_id: invoice.id,
                    user_id: user.id,
                    reminder_number: reminderNumber,
                    email_sent_to: clientEmail,
                })

                if (insertError) {
                    console.error('Erreur enregistrement relance:', insertError)
                    // L'email a été envoyé, on continue même si l'enregistrement échoue
                }

                results.push({ invoiceId: invoice.id, success: true })
            } catch (err) {
                console.error('Erreur relance facture:', err)
                results.push({ invoiceId: invoice.id, success: false, error: 'Erreur serveur' })
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
        console.error('Erreur POST /api/invoices/reminders:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        return NextResponse.json({
            error: 'Erreur serveur',
            details: errorMessage
        }, { status: 500 })
    }
}
