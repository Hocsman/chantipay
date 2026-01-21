import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/ai/stats
 * Retourne les statistiques d'utilisation de l'IA pour l'utilisateur
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'historique des générations IA
    const { data: aiHistory, error: historyError } = await supabase
      .from('ai_history')
      .select('id, created_at, items_count, total_ht, trade, agent')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Erreur récupération historique IA:', historyError)
    }

    // Récupérer les acceptations de suggestions
    const { data: acceptances, error: acceptError } = await supabase
      .from('ai_suggestion_acceptances')
      .select('id, accepted_at, estimated_price_ht, trade')
      .eq('user_id', user.id)

    if (acceptError) {
      console.error('Erreur récupération acceptations:', acceptError)
    }

    // Récupérer le nombre total de devis
    const { count: totalQuotes } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Calculs des statistiques
    const history = aiHistory || []
    const suggestions = acceptances || []

    // Nombre de générations IA
    const totalGenerations = history.length

    // Nombre total de lignes générées
    const totalLinesGenerated = history.reduce((sum, h) => sum + (h.items_count || 0), 0)

    // Valeur totale générée
    const totalValueGenerated = history.reduce((sum, h) => sum + (Number(h.total_ht) || 0), 0)

    // Suggestions acceptées
    const suggestionsAccepted = suggestions.length
    const suggestionsValue = suggestions.reduce((sum, s) => sum + (Number(s.estimated_price_ht) || 0), 0)

    // Estimation du temps économisé
    // Hypothèses:
    // - 3 min pour rédiger manuellement une ligne de devis
    // - 1 min pour vérifier/modifier une ligne générée par IA
    // - Donc 2 min économisées par ligne
    const minutesSavedPerLine = 2
    const totalMinutesSaved = totalLinesGenerated * minutesSavedPerLine
    const totalHoursSaved = Math.round(totalMinutesSaved / 60 * 10) / 10

    // Statistiques par métier
    const tradeStats: Record<string, { generations: number; lines: number; value: number }> = {}
    history.forEach(h => {
      const trade = h.trade || 'Autre'
      if (!tradeStats[trade]) {
        tradeStats[trade] = { generations: 0, lines: 0, value: 0 }
      }
      tradeStats[trade].generations++
      tradeStats[trade].lines += h.items_count || 0
      tradeStats[trade].value += Number(h.total_ht) || 0
    })

    // Statistiques par agent
    const agentStats: Record<string, number> = {}
    history.forEach(h => {
      const agent = h.agent || 'auto'
      agentStats[agent] = (agentStats[agent] || 0) + 1
    })

    // Activité par mois (6 derniers mois)
    const monthlyActivity: { month: string; count: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      const count = history.filter(h => h.created_at.startsWith(monthKey)).length
      monthlyActivity.push({ month: monthLabel, count })
    }

    // Taux d'utilisation IA (devis avec IA / total devis)
    const aiUsageRate = totalQuotes && totalQuotes > 0
      ? Math.round((totalGenerations / totalQuotes) * 100)
      : 0

    return NextResponse.json({
      // Métriques principales
      totalGenerations,
      totalLinesGenerated,
      totalValueGenerated,
      totalHoursSaved,

      // Suggestions
      suggestionsAccepted,
      suggestionsValue,

      // Taux
      aiUsageRate,
      totalQuotes: totalQuotes || 0,

      // Détails
      tradeStats: Object.entries(tradeStats).map(([trade, stats]) => ({
        trade,
        ...stats,
      })).sort((a, b) => b.generations - a.generations),

      agentStats: Object.entries(agentStats).map(([agent, count]) => ({
        agent,
        count,
      })).sort((a, b) => b.count - a.count),

      monthlyActivity,
    })
  } catch (error) {
    console.error('Erreur GET /api/ai/stats:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
