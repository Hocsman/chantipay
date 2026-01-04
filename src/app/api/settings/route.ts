/**
 * ===========================================
 * Settings API Route
 * ===========================================
 * PATCH /api/settings
 *
 * Updates user settings including company logo URL.
 *
 * Request Body:
 * - company_logo_url: string | null
 * - default_vat_rate: string
 * - default_deposit_percent: string
 * - pdf_footer_text: string
 *
 * Response:
 * - 200: Success - Settings updated
 * - 401: Unauthorized
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ============================================
    // 1. Vérifier l'authentification
    // ============================================
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Settings API] Auth error:', authError?.message)
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // ============================================
    // 2. Récupérer les données du body
    // ============================================
    const body = await request.json()
    const {
      company_logo_url,
      defaultVatRate,
      defaultDepositPercent,
      pdfFooterText,
    } = body

    // ============================================
    // 3. Mettre à jour les settings
    // ============================================
    const settingsData = {
      user_id: user.id,
      company_logo_url: company_logo_url || null,
      default_vat_rate: parseFloat(defaultVatRate) || 20,
      default_deposit_percent: parseFloat(defaultDepositPercent) || 30,
      pdf_footer_text: pdfFooterText || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('settings')
      .upsert(settingsData, {
        onConflict: 'user_id',
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('[Settings API] Error updating settings:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Settings API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
