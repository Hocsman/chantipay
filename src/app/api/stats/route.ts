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
 *     conversionRate: number;
 *     totalActionableQuotes: number;
 *     totalInvoicesFromQuotes: number;
 *     avgPaymentDelay: number;
 *     previousPeriodAvgDelay: number;
 *     monthlyRevenue: { month: string; revenue: number }[];
 *     quarterlyRevenue: { quarter: string; revenue: number }[];
 *     invoicesByStatus: { name: string; value: number }[];
 *     topClients: { name: string; total: number; invoiceCount: number }[];
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

    // Récupérer tous les devis
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id, status, total_ttc, created_at')
      .eq('user_id', user.id)

    if (quotesError) {
      console.error('Erreur devis:', quotesError)
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

    // Taux de conversion devis → facture
    const actionableQuotes = (quotes || []).filter(
      (q) => !['draft', 'canceled'].includes(q.status)
    )
    const invoicesFromQuotes = invoices.filter((inv) => inv.quote_id !== null)
    const conversionRate = actionableQuotes.length > 0
      ? Math.round((invoicesFromQuotes.length / actionableQuotes.length) * 100)
      : 0
    const totalActionableQuotes = actionableQuotes.length
    const totalInvoicesFromQuotes = invoicesFromQuotes.length

    // Délai moyen de paiement (en jours)
    const paidInvoicesList = invoices.filter(
      (inv) => inv.payment_status === 'paid' && inv.paid_at && inv.issue_date
    )
    let avgPaymentDelay = 0
    let previousPeriodAvgDelay = 0
    const now = new Date()

    if (paidInvoicesList.length > 0) {
      const delays = paidInvoicesList.map((inv) => {
        const paidDate = new Date(inv.paid_at!)
        const issueDate = new Date(inv.issue_date)
        return Math.max(0, Math.round((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)))
      })
      avgPaymentDelay = Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)

      // Tendance : 3 derniers mois vs 3 mois précédents
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

      const recentDelays = paidInvoicesList
        .filter((inv) => new Date(inv.paid_at!) >= threeMonthsAgo)
        .map((inv) => {
          const paidDate = new Date(inv.paid_at!)
          const issueDate = new Date(inv.issue_date)
          return Math.max(0, Math.round((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)))
        })

      const olderDelays = paidInvoicesList
        .filter((inv) => {
          const d = new Date(inv.paid_at!)
          return d >= sixMonthsAgo && d < threeMonthsAgo
        })
        .map((inv) => {
          const paidDate = new Date(inv.paid_at!)
          const issueDate = new Date(inv.issue_date)
          return Math.max(0, Math.round((paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)))
        })

      if (olderDelays.length > 0) {
        previousPeriodAvgDelay = Math.round(olderDelays.reduce((a, b) => a + b, 0) / olderDelays.length)
      }
    }

    // Chiffre d'affaires par mois (6 derniers mois)
    const monthlyRevenue: { month: string; revenue: number }[] = []
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

    // Chiffre d'affaires trimestriel (4 derniers trimestres)
    const quarterlyRevenue: { quarter: string; revenue: number }[] = []
    const currentQuarter = Math.floor(now.getMonth() / 3)
    for (let i = 3; i >= 0; i--) {
      const qOffset = currentQuarter - i
      const targetYear = now.getFullYear() + Math.floor(qOffset < 0 ? (qOffset - 3) / 4 : qOffset / 4)
      const normalizedQ = ((qOffset % 4) + 4) % 4
      const quarterStartMonth = normalizedQ * 3

      const quarterStart = new Date(targetYear, quarterStartMonth, 1)
      const quarterEnd = new Date(targetYear, quarterStartMonth + 3, 1)
      const label = `T${normalizedQ + 1} ${targetYear.toString().slice(-2)}`

      const qRevenue = invoices
        .filter((inv) => {
          if (inv.payment_status !== 'paid' || !inv.paid_at) return false
          const paidDate = new Date(inv.paid_at)
          return paidDate >= quarterStart && paidDate < quarterEnd
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)

      quarterlyRevenue.push({ quarter: label, revenue: qRevenue })
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
    const clientRevenue: Record<string, { name: string; total: number; invoiceCount: number }> = {}

    invoices
      .filter((inv) => inv.payment_status === 'paid' && inv.client_id)
      .forEach((inv) => {
        const clientId = inv.client_id!
        if (!clientRevenue[clientId]) {
          clientRevenue[clientId] = {
            name: inv.client_name,
            total: 0,
            invoiceCount: 0,
          }
        }
        clientRevenue[clientId].total += parseFloat(inv.total.toString())
        clientRevenue[clientId].invoiceCount += 1
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
        conversionRate,
        totalActionableQuotes,
        totalInvoicesFromQuotes,
        avgPaymentDelay,
        previousPeriodAvgDelay,
        monthlyRevenue,
        quarterlyRevenue,
        invoicesByStatus,
        topClients,
      },
    })
  } catch (error) {
    console.error('Erreur API stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
