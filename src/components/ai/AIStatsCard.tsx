'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  Clock,
  FileText,
  TrendingUp,
  Zap,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIStats {
  totalGenerations: number
  totalLinesGenerated: number
  totalValueGenerated: number
  totalHoursSaved: number
  suggestionsAccepted: number
  suggestionsValue: number
  aiUsageRate: number
  totalQuotes: number
  tradeStats: { trade: string; generations: number; lines: number; value: number }[]
  agentStats: { agent: string; count: number }[]
  monthlyActivity: { month: string; count: number }[]
}

const AGENT_LABELS: Record<string, string> = {
  quick: 'Rapide',
  advice: 'Conseil',
  compliance: 'Conformité',
  upsell: 'Options',
  auto: 'Auto',
}

export function AIStatsCard({ className }: { className?: string }) {
  const [stats, setStats] = useState<AIStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/ai/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Erreur chargement stats IA:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const maxMonthlyCount = Math.max(...stats.monthlyActivity.map(m => m.count), 1)

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-b">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Statistiques IA
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Économies de temps grâce à l'intelligence artificielle
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 whitespace-nowrap">
            <Zap className="h-3 w-3 mr-1" />
            {stats.aiUsageRate}% d'utilisation
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-100 dark:border-green-900">
            <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{stats.totalHoursSaved}h</p>
            <p className="text-xs text-muted-foreground">Temps économisé</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
            <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-3xl font-bold text-blue-600">{stats.totalGenerations}</p>
            <p className="text-xs text-muted-foreground">Devis générés</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl border border-violet-100 dark:border-violet-900">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-violet-600" />
            <p className="text-3xl font-bold text-violet-600">{stats.totalLinesGenerated}</p>
            <p className="text-xs text-muted-foreground">Lignes créées</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-100 dark:border-amber-900">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-amber-600" />
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats.totalValueGenerated)}</p>
            <p className="text-xs text-muted-foreground">Valeur générée</p>
          </div>
        </div>

        {/* Activité mensuelle */}
        {stats.monthlyActivity.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Activité IA (6 derniers mois)
            </h4>
            <div className="flex items-end gap-2 h-24">
              {stats.monthlyActivity.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-violet-500 to-purple-400 rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${(month.count / maxMonthlyCount) * 100}%`,
                      minHeight: month.count > 0 ? '4px' : '0',
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">{month.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions acceptées */}
        {stats.suggestionsAccepted > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Suggestions IA acceptées</span>
              <Badge variant="secondary">{stats.suggestionsAccepted}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Valeur ajoutée aux devis : <span className="font-medium text-foreground">{formatCurrency(stats.suggestionsValue)}</span>
            </p>
          </div>
        )}

        {/* Répartition par mode */}
        {stats.agentStats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Modes utilisés</h4>
            <div className="flex flex-wrap gap-2">
              {stats.agentStats.map((agent) => (
                <Badge key={agent.agent} variant="outline" className="px-3 py-1">
                  {AGENT_LABELS[agent.agent] || agent.agent}
                  <span className="ml-2 text-muted-foreground">{agent.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top métiers */}
        {stats.tradeStats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Par métier</h4>
            <div className="space-y-2">
              {stats.tradeStats.slice(0, 3).map((trade) => (
                <div key={trade.trade} className="flex items-center gap-3">
                  <span className="text-sm w-24 truncate">{trade.trade}</span>
                  <Progress
                    value={(trade.generations / stats.totalGenerations) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {trade.generations}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message d'encouragement */}
        {stats.totalHoursSaved > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm">
              Vous avez économisé environ <span className="font-bold text-green-600">{stats.totalHoursSaved} heures</span> de travail
              grâce à l'IA ChantiPay
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
