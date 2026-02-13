import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { DEFAULT_PERMISSIONS, PermissionKey } from '@/types/team'
import { TeamMemberRow } from '@/types/database'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * POST /api/team/invite
 * Envoie une invitation à un nouveau membre d'équipe
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Vérifier le plan d'abonnement
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, company_name, full_name')
    .eq('id', user.id)
    .single()

  // Pour le développement, on autorise même sans plan team
  // En production, décommenter cette vérification :
  // if (profile?.subscription_plan !== 'team') {
  //   return NextResponse.json(
  //     { error: 'Plan équipe requis pour inviter des membres' },
  //     { status: 403 }
  //   )
  // }

  const body = await request.json()
  const { email, firstName, lastName, roleTitle, phone, permissions } = body

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  // Vérifier si déjà invité
  // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
  const { data: existing } = await (supabase as any)
    .from('team_members')
    .select('id, invitation_status')
    .eq('owner_id', user.id)
    .eq('email', email.toLowerCase())
    .single() as { data: { id: string; invitation_status: string } | null; error: any }

  if (existing && existing.invitation_status === 'accepted') {
    return NextResponse.json(
      { error: 'Ce membre fait déjà partie de votre équipe' },
      { status: 400 }
    )
  }

  // Préparer les permissions (utiliser les valeurs par défaut si non spécifiées)
  const finalPermissions: Record<PermissionKey, boolean> = {
    ...DEFAULT_PERMISSIONS,
    ...(permissions || {}),
  }

  // Créer ou mettre à jour l'invitation
  const invitationToken = crypto.randomUUID()
  const invitationData = {
    owner_id: user.id,
    email: email.toLowerCase(),
    first_name: firstName || null,
    last_name: lastName || null,
    phone: phone || null,
    role_title: roleTitle || 'Membre',
    invitation_status: 'pending' as const,
    invitation_token: invitationToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invited_at: new Date().toISOString(),
  }

  const { data: teamMember, error: insertError } = await (supabase as any)
    .from('team_members')
    .upsert(invitationData, { onConflict: 'owner_id,email' })
    .select()
    .single() as { data: TeamMemberRow | null; error: any }

  if (insertError || !teamMember) {
    console.error('Error creating invitation:', insertError)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'invitation' },
      { status: 500 }
    )
  }

  // Créer ou mettre à jour les permissions
  const { error: permError } = await (supabase as any)
    .from('team_member_permissions')
    .upsert(
      {
        team_member_id: teamMember.id,
        ...finalPermissions,
      },
      { onConflict: 'team_member_id' }
    )

  if (permError) {
    console.error('Error creating permissions:', permError)
  }

  // Envoyer l'email d'invitation
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/team/accept/${invitationToken}`
  const companyName = profile?.company_name || profile?.full_name || 'Une entreprise'

  if (resend) {
    try {
      await resend.emails.send({
        from: 'ChantiPay <noreply@chantipay.com>',
        to: email,
        subject: `Invitation à rejoindre ${companyName} sur ChantiPay`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
                .button { display: inline-block; padding: 14px 32px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .button:hover { background: #ea580c; }
                .features { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .features ul { margin: 0; padding-left: 20px; }
                .features li { margin: 8px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .warning { font-size: 13px; color: #6b7280; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Invitation ChantiPay</h1>
                </div>
                <div class="content">
                  <p>Bonjour${firstName ? ' ' + firstName : ''},</p>
                  <p><strong>${profile?.full_name || 'Un patron'}</strong> vous invite à rejoindre
                  <strong>${companyName}</strong> sur ChantiPay.</p>

                  <div class="features">
                    <p><strong>ChantiPay vous permettra de :</strong></p>
                    <ul>
                      <li>Consulter les chantiers et tâches qui vous sont assignés</li>
                      <li>Pointer vos heures de travail avec géolocalisation</li>
                      <li>Créer des rapports de visite technique</li>
                      <li>Accéder aux informations clients (selon vos droits)</li>
                    </ul>
                  </div>

                  <p style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
                  </p>

                  <p class="warning">
                    Cette invitation expire dans 7 jours. Si vous n'avez pas demandé cette invitation,
                    vous pouvez ignorer cet email.
                  </p>
                </div>
                <div class="footer">
                  <p>ChantiPay - Gestion de devis et factures pour artisans</p>
                  <p>www.chantipay.com</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // On ne retourne pas d'erreur car l'invitation est créée
    }
  } else {
    console.log('Resend not configured. Invitation URL:', inviteUrl)
  }

  return NextResponse.json({
    success: true,
    teamMember: {
      id: teamMember.id,
      email: teamMember.email,
      invitation_status: teamMember.invitation_status,
    },
    inviteUrl: process.env.NODE_ENV === 'development' ? inviteUrl : undefined,
  })
}
