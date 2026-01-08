import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * ===========================================
 * Statistics API Route
 * ===========================================
 * GET /api/stats
 *
 * Récupère les statistiques de l'utilisateur :
 * - Chiffre d'affaires total et par mois
 * - Nombre de factures par statut
 * - Top clients
 * - Nombre de clients
 *
 * Response:
 * {
 *   stats: {
 *     totalRevenue: number;
 *     totalInvoices: number;
 *     totalClients: number;
 *     paidInvoices: number;
 *     pendingInvoices: number;
 *     overdueInvoices: number;
 *     monthlyRevenue: { month: string; revenue: number }[];
 *     invoicesByStatus: { name: string; value: number }[];
 *     topClients: { name: string; total: number }[];
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer toutes les factures
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)

    if (invoicesError) {
      console.error('Erreur factures:', invoicesError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des factures' },
        { status: 500 }
      )
    }

    // Récupérer tous les clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)

    if (clientsError) {
      console.error('Erreur clients:', clientsError)
    }

    const totalClients = clients?.length || 0

    // Calculer les statistiques
    const totalInvoices = invoices.length
    const paidInvoices = invoices.filter((inv) => inv.payment_status === 'paid').length
    const pendingInvoices = invoices.filter((inv) =>
      ['draft', 'sent'].includes(inv.payment_status)
    ).length
    const overdueInvoices = invoices.filter(
      (inv) => inv.payment_status === 'overdue'
    ).length

    const totalRevenue = invoices
      .filter((inv) => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)

    // Chiffre d'affaires par mois (6 derniers mois)
    const monthlyRevenue: { month: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      })

      const monthRevenue = invoices
        .filter((inv) => {
          if (inv.payment_status !== 'paid' || !inv.paid_at) return false
          const paidDate = new Date(inv.paid_at)
          return (
            paidDate.getMonth() === date.getMonth() &&
            paidDate.getFullYear() === date.getFullYear()
          )
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)

      monthlyRevenue.push({ month: monthStr, revenue: monthRevenue })
    }

    // Factures par statut
    const invoicesByStatus = [
      {
        name: 'Payées',
        value: invoices.filter((inv) => inv.payment_status === 'paid').length,
      },
      {
        name: 'Envoyées',
        value: invoices.filter((inv) => inv.payment_status === 'sent').length,
      },
      {
        name: 'Brouillons',
        value: invoices.filter((inv) => inv.payment_status === 'draft').length,
      },
      {
        name: 'En retard',
        value: invoices.filter((inv) => inv.payment_status === 'overdue').length,
      },
    ].filter((item) => item.value > 0)

    // Top 5 clients par CA
    const clientRevenue: Record<string, { name: string; total: number }> = {}

    invoices
      .filter((inv) => inv.payment_status === 'paid' && inv.client_id)
      .forEach((inv) => {
        const clientId = inv.client_id!
        if (!clientRevenue[clientId]) {
          clientRevenue[clientId] = {
            name: inv.client_name,
            total: 0,
          }
        }
        clientRevenue[clientId].total += parseFloat(inv.total.toString())
      })

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        totalRevenue,
        totalInvoices,
        totalClients,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        monthlyRevenue,
        invoicesByStatus,
        topClients,
      },
    })
  } catch (error) {
    console.error('Erreur API stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
