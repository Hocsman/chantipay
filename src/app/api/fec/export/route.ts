/**
 * ===========================================
 * FEC Export API Route
 * ===========================================
 * GET /api/fec/export?from=2025-01-01&to=2025-12-31
 *
 * Génère et télécharge le Fichier des Écritures Comptables (FEC)
 * au format TSV conforme au standard fiscal français.
 *
 * Query params:
 * - from: string (date de début ISO, requis)
 * - to: string (date de fin ISO, requis)
 *
 * Response:
 * - 200: Fichier TSV (text/plain)
 * - 400: SIRET manquant ou dates invalides
 * - 401: Non authentifié
 * - 404: Aucune écriture trouvée
 * - 500: Erreur serveur
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFec, getFecFilename } from '@/lib/fec/generateFec'
import type { FecInvoice, FecCreditNote } from '@/lib/fec/generateFec'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Paramètres
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Les paramètres "from" et "to" sont requis' },
        { status: 400 }
      )
    }

    // Récupérer le profil (SIRET requis)
    const { data: profile } = await supabase
      .from('profiles')
      .select('siret, company_name, full_name, tax_status')
      .eq('id', user.id)
      .single()

    const siret = profile?.siret?.replace(/\s/g, '') || ''
    if (!siret || siret.length < 9) {
      return NextResponse.json(
        {
          error: 'SIRET requis',
          details: 'Veuillez renseigner votre numéro SIRET dans les paramètres avant de générer le FEC.',
          code: 'MISSING_SIRET',
        },
        { status: 400 }
      )
    }

    const siren = siret.slice(0, 9)

    // Récupérer les factures (hors brouillon et annulées)
    const { data: invoicesRaw, error: invError } = await supabase
      .from('invoices')
      .select('invoice_number, issue_date, paid_at, payment_status, payment_method, client_name, client_siret, client_id, subtotal, tax_rate, tax_amount, total, paid_amount')
      .eq('user_id', user.id)
      .gte('issue_date', from)
      .lte('issue_date', to)
      .not('payment_status', 'in', '("draft","canceled")')
      .order('issue_date', { ascending: true })

    if (invError) {
      console.error('[FEC Export] Erreur factures:', invError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Récupérer les avoirs finalisés
    const { data: creditNotesRaw, error: cnError } = await supabase
      .from('credit_notes')
      .select('credit_note_number, issue_date, client_name, client_siret, client_id, subtotal, tax_rate, tax_amount, total')
      .eq('user_id', user.id)
      .eq('status', 'finalized')
      .gte('issue_date', from)
      .lte('issue_date', to)
      .order('issue_date', { ascending: true })

    if (cnError) {
      console.error('[FEC Export] Erreur avoirs:', cnError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const invoices: FecInvoice[] = (invoicesRaw || []).map((inv) => ({
      invoice_number: inv.invoice_number,
      issue_date: inv.issue_date,
      paid_at: inv.paid_at,
      payment_status: inv.payment_status,
      payment_method: inv.payment_method,
      client_name: inv.client_name,
      client_siret: inv.client_siret,
      client_id: inv.client_id,
      subtotal: inv.subtotal || 0,
      tax_rate: inv.tax_rate || 0,
      tax_amount: inv.tax_amount || 0,
      total: inv.total || 0,
      paid_amount: inv.paid_amount || 0,
    }))

    const creditNotes: FecCreditNote[] = (creditNotesRaw || []).map((cn) => ({
      credit_note_number: cn.credit_note_number,
      issue_date: cn.issue_date,
      client_name: cn.client_name,
      client_siret: cn.client_siret,
      client_id: cn.client_id,
      subtotal: cn.subtotal || 0,
      tax_rate: cn.tax_rate || 0,
      tax_amount: cn.tax_amount || 0,
      total: cn.total || 0,
    }))

    if (invoices.length === 0 && creditNotes.length === 0) {
      return NextResponse.json(
        { error: 'Aucune écriture comptable trouvée pour cette période' },
        { status: 404 }
      )
    }

    // Générer le FEC
    const fecContent = generateFec(invoices, creditNotes, {
      siren,
      companyName: profile?.company_name || profile?.full_name || '',
      taxStatus: profile?.tax_status || 'standard',
      closingDate: to,
    })

    const filename = getFecFilename(siren, to)

    return new Response(fecContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[FEC Export] Erreur inattendue:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
