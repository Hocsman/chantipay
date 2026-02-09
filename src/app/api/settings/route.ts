/**
 * ===========================================
 * Settings API Route
 * ===========================================
 * PATCH /api/settings
 *
 * Updates user profile and settings including company info, tax status, etc.
 *
 * Request Body:
 * Profile fields:
 * - companyName, fullName, email, phone, address
 * - siret, vatNumber, taxStatus, isSubcontractor
 * - rcs, apeCode, shareCapital
 *
 * Settings fields:
 * - company_logo_url: string | null
 * - defaultVatRate: string
 * - defaultDepositPercent: string
 * - pdfFooterText: string
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
      // Profile fields
      companyName,
      fullName,
      email,
      phone,
      address,
      siret,
      vatNumber,
      taxStatus,
      isSubcontractor,
      rcs,
      apeCode,
      shareCapital,
      // Settings fields
      company_logo_url,
      defaultVatRate,
      defaultDepositPercent,
      pdfFooterText,
    } = body

    // ============================================
    // 3. Mettre à jour le profil
    // ============================================
    const profileData = {
      company_name: companyName || null,
      full_name: fullName || null,
      email: email || user.email,
      phone: phone || null,
      address: address || null,
      siret: siret || null,
      vat_number: vatNumber || null,
      tax_status: taxStatus || 'standard',
      is_subcontractor: isSubcontractor || false,
      rcs: rcs || null,
      ape_code: apeCode || null,
      share_capital: shareCapital || null,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', user.id)

    if (profileError) {
      console.error('[Settings API] Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du profil', details: profileError.message },
        { status: 500 }
      )
    }

    // ============================================
    // 4. Mettre à jour les settings
    // ============================================
    const settingsData = {
      user_id: user.id,
      company_logo_url: company_logo_url || null,
      default_vat_rate: parseFloat(defaultVatRate) || 20,
      default_deposit_percent: parseFloat(defaultDepositPercent) || 30,
      pdf_footer_text: pdfFooterText || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error: settingsError } = await supabase
      .from('settings')
      .upsert(settingsData, {
        onConflict: 'user_id',
      })
      .select()
      .maybeSingle()

    if (settingsError) {
      console.error('[Settings API] Error updating settings:', settingsError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde des paramètres', details: settingsError.message },
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
