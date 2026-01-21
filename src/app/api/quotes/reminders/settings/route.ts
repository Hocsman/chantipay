import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/quotes/reminders/settings
 * Récupère les paramètres de relance de l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Retourner les valeurs par défaut si pas de settings
    const result = {
      enabled: settings?.enabled ?? true,
      firstReminderDays: settings?.first_reminder_days ?? 3,
      secondReminderDays: settings?.second_reminder_days ?? 7,
      thirdReminderDays: settings?.third_reminder_days ?? 14,
      maxReminders: settings?.max_reminders ?? 3,
      customMessage: settings?.custom_message ?? '',
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erreur GET /api/quotes/reminders/settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * PUT /api/quotes/reminders/settings
 * Met à jour les paramètres de relance
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const {
      enabled,
      firstReminderDays,
      secondReminderDays,
      thirdReminderDays,
      maxReminders,
      customMessage,
    } = body

    // Validation
    if (firstReminderDays && (firstReminderDays < 1 || firstReminderDays > 30)) {
      return NextResponse.json({ error: 'Délai première relance invalide (1-30 jours)' }, { status: 400 })
    }
    if (secondReminderDays && (secondReminderDays < 1 || secondReminderDays > 60)) {
      return NextResponse.json({ error: 'Délai seconde relance invalide (1-60 jours)' }, { status: 400 })
    }
    if (thirdReminderDays && (thirdReminderDays < 1 || thirdReminderDays > 90)) {
      return NextResponse.json({ error: 'Délai troisième relance invalide (1-90 jours)' }, { status: 400 })
    }
    if (maxReminders && (maxReminders < 0 || maxReminders > 5)) {
      return NextResponse.json({ error: 'Nombre max de relances invalide (0-5)' }, { status: 400 })
    }

    // Upsert les paramètres
    const { data, error } = await supabase
      .from('reminder_settings')
      .upsert({
        user_id: user.id,
        enabled: enabled ?? true,
        first_reminder_days: firstReminderDays ?? 3,
        second_reminder_days: secondReminderDays ?? 7,
        third_reminder_days: thirdReminderDays ?? 14,
        max_reminders: maxReminders ?? 3,
        custom_message: customMessage || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur mise à jour settings:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      settings: {
        enabled: data.enabled,
        firstReminderDays: data.first_reminder_days,
        secondReminderDays: data.second_reminder_days,
        thirdReminderDays: data.third_reminder_days,
        maxReminders: data.max_reminders,
        customMessage: data.custom_message || '',
      },
    })
  } catch (error) {
    console.error('Erreur PUT /api/quotes/reminders/settings:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
