'use client'

import { useState, useEffect } from 'react'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Euro, FileText, Users, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface Stats {
  totalRevenue: number
  totalInvoices: number
  totalClients: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyRevenue: { month: string; revenue: number }[]
  invoicesByStatus: { name: string; value: number }[]
  topClients: { name: string; total: number }[]
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName
}: {
  title: string
  value: string | number
  subtitle: string
  icon: typeof Euro
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  iconClassName?: string
}) => (
  <div className={cn(
    "relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
    className
  )}>
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className={cn(
        "rounded-xl p-3 transition-colors",
        iconClassName || "bg-primary/10"
      )}>
        <Icon className={cn("h-5 w-5", iconClassName ? "text-inherit" : "text-primary")} />
      </div>
    </div>
    {/* Decorative gradient */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
  </div>
)

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader title="Statistiques" description="Analyse de votre activité" />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </LayoutContainer>
    )
  }

  if (!stats) {
    return (
      <LayoutContainer>
        <PageHeader title="Statistiques" description="Aucune donnée disponible" />
      </LayoutContainer>
    )
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

  return (
    <LayoutContainer>
      <PageHeader
        title="Statistiques"
        description="Analyse de votre activité et performances"
      />

      <div className="space-y-8">
        {/* KPIs avec design premium */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Chiffre d'affaires"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${stats.paidInvoices} facture${stats.paidInvoices > 1 ? 's' : ''} payée${stats.paidInvoices > 1 ? 's' : ''}`}
            icon={Euro}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/20 dark:border-emerald-800"
            iconClassName="bg-emerald-500 text-white"
          />

          <StatCard
            title="Factures"
            value={stats.totalInvoices}
            subtitle={`${stats.pendingInvoices} en attente`}
            icon={FileText}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800"
            iconClassName="bg-blue-500 text-white"
          />

          <StatCard
            title="Clients"
            value={stats.totalClients}
            subtitle="Clients actifs"
            icon={Users}
            className="bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200 dark:from-violet-950/30 dark:to-violet-900/20 dark:border-violet-800"
            iconClassName="bg-violet-500 text-white"
          />

          <StatCard
            title="En retard"
            value={stats.overdueInvoices}
            subtitle={`Facture${stats.overdueInvoices > 1 ? 's' : ''} impayée${stats.overdueInvoices > 1 ? 's' : ''}`}
            icon={AlertCircle}
            className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800"
            iconClassName="bg-red-500 text-white"
          />
        </div>

        {/* Graphiques avec design amélioré */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Évolution mensuelle avec Area Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500 p-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Évolution du chiffre d'affaires
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Chiffre d'affaires"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Factures par statut avec Donut */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500 p-2">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Répartition des factures
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.invoicesByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.invoicesByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top clients avec Bar Chart */}
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500 p-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Top 5 clients par chiffre d'affaires
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topClients} layout="vertical">
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="total"
                    name="Chiffre d'affaires"
                    fill="url(#colorBar)"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutContainer>
  )
}
