import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// Initialisation conditionnelle pour éviter l'erreur au build
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configurée')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

/**
 * POST /api/visit-reports/[id]/send-email
 * Envoie le rapport de visite par email au client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Récupérer le rapport
    const { data: report, error: reportError } = await supabase
      .from('visit_reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Rapport non trouvé' }, { status: 404 })
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, full_name, email, phone')
      .eq('id', user.id)
      .single()

    const companyName = profile?.company_name || profile?.full_name || 'ChantiPay'

    // Construire les URLs des photos
    const photoUrls = (report.photo_urls || []).map((path: string) => {
      const { data } = supabase.storage.from('visit-reports').getPublicUrl(path)
      return data.publicUrl
    })

    // Générer le contenu de l'email
    const diagnosticsList = (report.diagnostics || []).map((d: string) => `• ${d}`).join('\n')
    const recommendationsList = (report.recommendations || []).map((r: string) => `• ${r}`).join('\n')
    const nonConformitiesList = (report.non_conformities || [])
      .map((nc: any) => `• ${nc.title} (${nc.severity})`)
      .join('\n')

    const emailContent = `
Bonjour,

Veuillez trouver ci-dessous le rapport de visite technique.

${report.client_name ? `Client : ${report.client_name}` : ''}
${report.location ? `Lieu : ${report.location}` : ''}
${report.visit_date ? `Date de visite : ${new Date(report.visit_date).toLocaleDateString('fr-FR')}` : ''}

---

RÉSUMÉ
${report.summary}

${diagnosticsList ? `DIAGNOSTICS\n${diagnosticsList}\n` : ''}
${nonConformitiesList ? `NON-CONFORMITÉS DÉTECTÉES\n${nonConformitiesList}\n` : ''}
${recommendationsList ? `RECOMMANDATIONS\n${recommendationsList}\n` : ''}

---

Cordialement,
${companyName}
${profile?.phone ? `Tél : ${profile.phone}` : ''}
${profile?.email ? `Email : ${profile.email}` : ''}

---
Rapport généré via ChantiPay
    `.trim()

    // Envoyer l'email
    const resend = getResendClient()
    const { error: sendError } = await resend.emails.send({
      from: 'ChantiPay <noreply@chantipay.com>',
      to: [email],
      subject: `Rapport de visite technique${report.client_name ? ` - ${report.client_name}` : ''}`,
      text: emailContent,
    })

    if (sendError) {
      console.error('Erreur envoi email:', sendError)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
    }

    // Mettre à jour le rapport avec les infos d'envoi
    await supabase
      .from('visit_reports')
      .update({
        sent_to_email: email,
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur API send-email:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
