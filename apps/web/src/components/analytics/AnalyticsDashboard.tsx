'use client'

import { useMemo, useState } from 'react'
import {
  Users, FolderKanban, CheckSquare, Building2,
  TrendingUp, AlertCircle, DollarSign, Target, Trophy, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LabelList } from 'recharts'
import { cn } from '@/lib/utils'

// ─── types ────────────────────────────────────────────────────────────────────

type RawTask    = { id: string; status: string; priority: string; project_id: string; assignee_id: string | null }
type RawProject = { id: string; title: string; status: string; client_id: string | null }
type RawClient  = { id: string; name: string }
type RawUser    = { id: string; full_name: string | null }
type RawDeal    = {
  id: string; title: string; stage: string
  value_cents: number | null; currency: string
  probability: number | null; expected_close_date: string | null
  owner_id: string | null; client_id: string
  lost_reason: string | null
  created_at: string; updated_at: string
}

interface Props {
  totals: { clients: number; projects: number; tasks: number; users: number }
  tasks: RawTask[]
  projects: RawProject[]
  clients: RawClient[]
  users: RawUser[]
  deals: RawDeal[]
}

// ─── configs ──────────────────────────────────────────────────────────────────

const statusConfig: ChartConfig = {
  backlog:     { label: 'Backlog',     color: 'hsl(267 15% 75%)' },        /* light muted purple */
  in_progress: { label: 'In Progress', color: 'hsl(var(--chart-1))' },     /* brand orange       */
  in_review:   { label: 'In Review',   color: 'hsl(var(--chart-3))' },     /* mid purple         */
  done:        { label: 'Done',        color: 'hsl(var(--chart-2))' },     /* brand blue         */
}

const priorityConfig: ChartConfig = {
  low:    { label: 'Low',    color: 'hsl(267 15% 78%)' },
  medium: { label: 'Medium', color: 'hsl(var(--chart-4))' },
  high:   { label: 'High',   color: 'hsl(var(--chart-1))' },
  urgent: { label: 'Urgent', color: 'hsl(18 100% 40%)' },
}

const projectStatusConfig: ChartConfig = {
  active:    { label: 'Active',    color: 'hsl(var(--chart-1))' },
  on_hold:   { label: 'On Hold',   color: 'hsl(var(--chart-3))' },
  completed: { label: 'Completed', color: 'hsl(var(--chart-2))' },
}

const dealStageConfig: ChartConfig = {
  lead:        { label: 'Lead',        color: '#64748b' },
  qualified:   { label: 'Qualified',   color: '#3b82f6' },
  proposal:    { label: 'Proposal',    color: '#8b5cf6' },
  negotiation: { label: 'Negotiation', color: '#f59e0b' },
  won:         { label: 'Won',         color: '#10b981' },
  lost:        { label: 'Lost',        color: '#f43f5e' },
}

const OPEN_STAGES = ['lead', 'qualified', 'proposal', 'negotiation'] as const

function formatMoney(cents: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toLocaleString()}`
  }
}

function formatMoneyShort(cents: number) {
  const v = cents / 100
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`
  return `$${v.toFixed(0)}`
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

const animProps = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 350,
  animationEasing: 'ease-out' as const,
}

const gridProps = { stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }
const axisProps = {
  tickLine: false as const,
  axisLine: false as const,
  tick: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, bg, sub }: {
  label: string; value: number | string; icon: React.ElementType
  color: string; bg: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', bg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <div>
          <p className="text-3xl font-bold leading-none tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── donut with inline breakdown list ────────────────────────────────────────

function DonutWithBreakdown({ data, config, total, label }: {
  data: { key: string; name: string; value: number }[]
  config: ChartConfig
  total: number
  label: string
}) {
  return (
    <div className="flex items-center gap-6">
      {/* chart */}
      <div className="shrink-0 w-[200px]">
        <ChartContainer config={config} className="h-[200px] w-full">
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius="52%" outerRadius="76%"
              dataKey="value" nameKey="key"
              paddingAngle={2} strokeWidth={0}
              {...animProps} animationDuration={700}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Pie>
            <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '1.5rem', fontWeight: 700, fill: 'hsl(var(--foreground))' }}>
              {total}
            </text>
            <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '0.7rem', fill: 'hsl(var(--muted-foreground))' }}>
              {label}
            </text>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </div>

      {/* breakdown list */}
      <div className="flex-1 space-y-1">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div
              key={item.key}
              className="group px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-default"
              title={`${config[item.key]?.label ?? item.name}: ${item.value} (${pct}%)`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--color-${item.key})` }} />
                  {config[item.key]?.label ?? item.name}
                </span>
                <span className="text-sm font-semibold tabular-nums group-hover:text-foreground transition-colors">
                  {item.value} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `var(--color-${item.key})`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── stacked bar with totals visible ─────────────────────────────────────────

function ChartColorLegend({ config, keys }: { config: ChartConfig; keys: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
      {keys.map((key) => {
        const color = (config[key] as { color?: string })?.color ?? 'hsl(var(--muted-foreground))'
        return (
          <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] shrink-0" style={{ backgroundColor: color }} />
            {config[key]?.label ?? key}
          </span>
        )
      })}
    </div>
  )
}

function StackedBarWithTotals({ data, config, keys, height = 260 }: {
  data: Record<string, string | number>[]
  config: ChartConfig
  keys: string[]
  height?: number
}) {
  const withTotals = data.map((row) => ({
    ...row,
    _total: keys.reduce((sum, k) => sum + ((row[k] as number) || 0), 0),
  }))

  return (
    <div className="w-full">
      <ChartColorLegend config={config} keys={keys} />
      <ChartContainer config={config} style={{ height }} className="w-full">
        <BarChart
          data={withTotals}
          barSize={40}
          margin={{ top: 20, right: 8, bottom: 4, left: 0 }}
        >
          <CartesianGrid vertical={false} {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted))', radius: 6 }}
            content={<ChartTooltipContent indicator="dot" />}
          />
          {keys.map((key, i) => {
            const isLast = i === keys.length - 1
            return (
              <Bar key={key} dataKey={key} stackId="a"
                fill={`var(--color-${key})`}
                radius={isLast ? [4, 4, 0, 0] : undefined}
                {...animProps}
              >
                {isLast && (
                  <LabelList
                    dataKey="_total"
                    position="top"
                    style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                  />
                )}
              </Bar>
            )
          })}
        </BarChart>
      </ChartContainer>
    </div>
  )
}

// ─── breakdown table ──────────────────────────────────────────────────────────

function BreakdownTable({ rows }: { rows: { label: string; value: number; color?: string; sub?: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="space-y-1.5 mt-4">
      {rows.map((row) => {
        const pct = Math.round((row.value / max) * 100)
        return (
          <div
            key={row.label}
            className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-default"
            title={row.sub ?? `${row.label}: ${row.value}`}
          >
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors w-28 shrink-0 truncate">
              {row.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: row.color ?? 'hsl(var(--chart-1))',
                }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums w-6 text-right shrink-0 group-hover:text-foreground transition-colors">
              {row.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function AnalyticsDashboard({ totals, tasks, projects, clients, users, deals }: Props) {

  const taskStatusData = useMemo(() => {
    const c = { backlog: 0, in_progress: 0, in_review: 0, done: 0 } as Record<string, number>
    tasks.forEach((t) => { if (c[t.status] !== undefined) c[t.status]++ })
    return [
      { key: 'backlog',     name: 'Backlog',     value: c.backlog },
      { key: 'in_progress', name: 'In Progress', value: c.in_progress },
      { key: 'in_review',   name: 'In Review',   value: c.in_review },
      { key: 'done',        name: 'Done',        value: c.done },
    ].filter((d) => d.value > 0)
  }, [tasks])

  const projectStatusData = useMemo(() => {
    const c = { active: 0, on_hold: 0, completed: 0 } as Record<string, number>
    projects.forEach((p) => { if (c[p.status] !== undefined) c[p.status]++ })
    return [
      { key: 'active',    name: 'Active',    value: c.active },
      { key: 'on_hold',   name: 'On Hold',   value: c.on_hold },
      { key: 'completed', name: 'Completed', value: c.completed },
    ].filter((d) => d.value > 0)
  }, [projects])

  const tasksPerProject = useMemo(() => {
    const map: Record<string, { name: string; backlog: number; in_progress: number; in_review: number; done: number }> = {}
    projects.forEach((p) => {
      const short = p.title.length > 16 ? p.title.slice(0, 14) + '…' : p.title
      map[p.id] = { name: short, backlog: 0, in_progress: 0, in_review: 0, done: 0 }
    })
    tasks.forEach((t) => {
      if (!map[t.project_id]) return
      const k = t.status as keyof (typeof map)[string]
      if (k !== 'name') map[t.project_id][k]++
    })
    return Object.values(map)
  }, [tasks, projects])

  const tasksPerUser = useMemo(() => {
    const nameMap: Record<string, string> = {}
    users.forEach((u) => { nameMap[u.id] = (u.full_name ?? 'Unknown').split(' ')[0] })
    const map: Record<string, { name: string; backlog: number; in_progress: number; in_review: number; done: number }> = {}
    tasks.forEach((t) => {
      if (!t.assignee_id) return
      const name = nameMap[t.assignee_id] ?? 'Unknown'
      if (!map[t.assignee_id]) map[t.assignee_id] = { name, backlog: 0, in_progress: 0, in_review: 0, done: 0 }
      const k = t.status as keyof (typeof map)[string]
      if (k !== 'name') map[t.assignee_id][k]++
    })
    return Object.values(map)
  }, [tasks, users])

  const priorityData = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0, urgent: 0 } as Record<string, number>
    tasks.forEach((t) => { if (c[t.priority] !== undefined) c[t.priority]++ })
    return [
      { name: 'Low',    low:    c.low },
      { name: 'Medium', medium: c.medium },
      { name: 'High',   high:   c.high },
      { name: 'Urgent', urgent: c.urgent },
    ]
  }, [tasks])

  const projectsPerClient = useMemo(() => {
    const cMap: Record<string, string> = {}
    clients.forEach((c) => { cMap[c.id] = c.name })
    const map: Record<string, { name: string; active: number; on_hold: number; completed: number }> = {}
    projects.forEach((p) => {
      const name = p.client_id ? (cMap[p.client_id] ?? 'Unknown') : 'No Client'
      if (!map[name]) map[name] = { name, active: 0, on_hold: 0, completed: 0 }
      const k = p.status as keyof (typeof map)[string]
      if (k !== 'name') map[name][k]++
    })
    return Object.values(map)
  }, [projects, clients])

  // ─── deals ──────────────────────────────────────────────────────────────────

  const openDeals = useMemo(() => deals.filter((d) => OPEN_STAGES.includes(d.stage as typeof OPEN_STAGES[number])), [deals])
  const wonDeals  = useMemo(() => deals.filter((d) => d.stage === 'won'),  [deals])
  const lostDeals = useMemo(() => deals.filter((d) => d.stage === 'lost'), [deals])

  const pipelineValue = openDeals.reduce((s, d) => s + (d.value_cents ?? 0), 0)
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + ((d.value_cents ?? 0) * (d.probability ?? 0)) / 100, 0,
  )
  const wonValue = wonDeals.reduce((s, d) => s + (d.value_cents ?? 0), 0)
  const winRate = (wonDeals.length + lostDeals.length) > 0
    ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100) : 0
  const avgWonSize = wonDeals.length > 0 ? Math.round(wonValue / wonDeals.length) : 0

  const dealCountByStage = useMemo(() => {
    const counts: Record<string, number> = { lead: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 }
    deals.forEach((d) => { if (counts[d.stage] !== undefined) counts[d.stage]++ })
    return (['lead','qualified','proposal','negotiation','won','lost'] as const)
      .map((k) => ({ key: k, name: dealStageConfig[k].label as string, value: counts[k] }))
      .filter((d) => d.value > 0)
  }, [deals])

  const pipelineValueByStage = useMemo(() => {
    const sums: Record<string, number> = { lead: 0, qualified: 0, proposal: 0, negotiation: 0 }
    openDeals.forEach((d) => { sums[d.stage] = (sums[d.stage] ?? 0) + (d.value_cents ?? 0) })
    return (['lead','qualified','proposal','negotiation'] as const).map((k) => ({
      key:   k,
      name:  dealStageConfig[k].label as string,
      value: Math.round(sums[k] / 100),
    }))
  }, [openDeals])

  const pipelinePerOwner = useMemo(() => {
    const nameMap: Record<string, string> = {}
    users.forEach((u) => { nameMap[u.id] = (u.full_name ?? 'Unknown').split(' ')[0] })
    const sums: Record<string, { name: string; value: number }> = {}
    openDeals.forEach((d) => {
      const id = d.owner_id ?? '_unassigned'
      const name = d.owner_id ? (nameMap[d.owner_id] ?? 'Unknown') : 'Unassigned'
      if (!sums[id]) sums[id] = { name, value: 0 }
      sums[id].value += (d.value_cents ?? 0)
    })
    return Object.values(sums)
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((x) => ({ label: x.name, value: Math.round(x.value / 100) }))
  }, [openDeals, users])

  const closingSoon = useMemo(() => {
    const clientMap: Record<string, string> = {}
    clients.forEach((c) => { clientMap[c.id] = c.name })
    return openDeals
      .filter((d) => d.expected_close_date && daysUntil(d.expected_close_date) <= 30)
      .map((d) => ({
        id: d.id,
        title: d.title,
        stage: d.stage as keyof typeof dealStageConfig,
        value_cents: d.value_cents ?? 0,
        client: clientMap[d.client_id] ?? 'Unknown',
        days: daysUntil(d.expected_close_date!),
      }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 8)
  }, [openDeals, clients])

  const lostReasons = useMemo(() => {
    const counts: Record<string, number> = {}
    lostDeals.forEach((d) => {
      const reason = d.lost_reason?.trim() || 'No reason given'
      counts[reason] = (counts[reason] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [lostDeals])

  // ─── tasks/team/projects derived ────────────────────────────────────────────

  const openTasks      = tasks.filter((t) => t.status !== 'done').length
  const unassignedOpen = tasks.filter((t) => !t.assignee_id && t.status !== 'done').length
  const urgentTasks    = tasks.filter((t) => t.priority === 'urgent').length
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0
  const avgTasksPerProj = projects.length > 0 ? Math.round(tasks.length / projects.length) : 0

  const statusKeys   = ['backlog', 'in_progress', 'in_review', 'done']
  const projectKeys  = ['active', 'on_hold', 'completed']

  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your team, projects, and tasks</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden px-8 pb-8">
        <TabsList className="shrink-0 w-fit mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent forceMount value="overview" className={cn('flex-1 overflow-y-auto space-y-6 mt-0', activeTab !== 'overview' && 'hidden')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Clients"      value={totals.clients}  icon={Building2}    color="text-violet-500"  bg="bg-violet-50 dark:bg-violet-950/40" />
            <StatCard label="Projects"     value={totals.projects} icon={FolderKanban} color="text-blue-500"    bg="bg-blue-50 dark:bg-blue-950/40" />
            <StatCard label="Total Tasks"  value={totals.tasks}    icon={CheckSquare}  color="text-amber-500"   bg="bg-amber-50 dark:bg-amber-950/40"  sub={`${completionRate}% complete`} />
            <StatCard label="Team Members" value={totals.users}    icon={Users}        color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/40" sub={`${unassignedOpen} unassigned open`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Tasks by Status</CardTitle>
                <CardDescription>{tasks.length} total tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutWithBreakdown data={taskStatusData} config={statusConfig} total={tasks.length} label="tasks" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Projects by Status</CardTitle>
                <CardDescription>{projects.length} total projects</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutWithBreakdown data={projectStatusData} config={projectStatusConfig} total={projects.length} label="projects" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Open Tasks',          value: openTasks,       icon: CheckSquare,  color: 'text-blue-500' },
              { label: 'Unassigned',          value: unassignedOpen,  icon: AlertCircle,  color: 'text-amber-500' },
              { label: 'Urgent Priority',     value: urgentTasks,     icon: AlertCircle,  color: 'text-red-500' },
              { label: 'Completion Rate',     value: `${completionRate}%`, icon: TrendingUp,   color: 'text-emerald-500' },
              { label: 'Active Projects',     value: projects.filter((p) => p.status === 'active').length, icon: FolderKanban, color: 'text-blue-500' },
              { label: 'Avg Tasks / Project', value: avgTasksPerProj, icon: TrendingUp,   color: 'text-violet-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4 flex flex-col gap-1">
                  <Icon className={cn('h-4 w-4', color)} />
                  <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── DEALS ── */}
        <TabsContent forceMount value="deals" className={cn('flex-1 overflow-y-auto space-y-6 mt-0', activeTab !== 'deals' && 'hidden')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Open Pipeline"      value={formatMoneyShort(pipelineValue)}    icon={DollarSign} color="text-blue-500"    bg="bg-blue-50 dark:bg-blue-950/40"       sub={`${openDeals.length} open deals`} />
            <StatCard label="Weighted Pipeline"  value={formatMoneyShort(weightedPipeline)} icon={Target}     color="text-violet-500"  bg="bg-violet-50 dark:bg-violet-950/40"   sub="Value × probability" />
            <StatCard label="Win Rate"           value={`${winRate}%`}                      icon={Trophy}     color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/40" sub={`${wonDeals.length} won / ${lostDeals.length} lost`} />
            <StatCard label="Avg Won Deal"       value={avgWonSize > 0 ? formatMoneyShort(avgWonSize) : '—'} icon={TrendingUp} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-950/40" sub={wonDeals.length > 0 ? `${formatMoneyShort(wonValue)} total won` : 'No won deals yet'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Pipeline Value by Stage</CardTitle>
                <CardDescription>Open deals only · labels show $ value</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={dealStageConfig} className="h-[260px] w-full">
                  <BarChart data={pipelineValueByStage} barSize={56} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid vertical={false} {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis
                      {...axisProps}
                      allowDecimals={false}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                    />
                    <ChartTooltip
                      cursor={{ fill: 'hsl(var(--muted))', radius: 6 }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value) => formatMoney((value as number) * 100)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[4,4,0,0]} {...animProps}>
                      {pipelineValueByStage.map((entry) => (
                        <Cell key={entry.key} fill={(dealStageConfig[entry.key] as { color: string }).color} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v: number) =>
                          v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`
                        }
                        style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Deals by Stage</CardTitle>
                <CardDescription>{deals.length} total deals · all-time</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutWithBreakdown data={dealCountByStage} config={dealStageConfig} total={deals.length} label="deals" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Pipeline per Owner</CardTitle>
                <CardDescription>Sum of open-deal value by owner</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelinePerOwner.length > 0 ? (
                  <BreakdownTable
                    rows={pipelinePerOwner.map((p) => ({
                      label: p.label,
                      value: p.value,
                      color: 'hsl(var(--chart-1))',
                      sub: `${p.label}: ${formatMoney(p.value * 100)}`,
                    }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No open deals with owners</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Closing Soon
                </CardTitle>
                <CardDescription>Open deals with expected close in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {closingSoon.length > 0 ? (
                  <div className="space-y-1">
                    {closingSoon.map((d) => {
                      const stageColor = (dealStageConfig[d.stage] as { color: string }).color
                      const overdue = d.days < 0
                      return (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: stageColor }}
                            title={dealStageConfig[d.stage].label as string}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{d.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{d.client}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold tabular-nums">
                              {d.value_cents > 0 ? formatMoneyShort(d.value_cents) : '—'}
                            </p>
                            <p className={cn(
                              'text-xs tabular-nums',
                              overdue ? 'text-red-500' : d.days <= 7 ? 'text-amber-500' : 'text-muted-foreground',
                            )}>
                              {overdue ? `${Math.abs(d.days)}d overdue` : d.days === 0 ? 'today' : `${d.days}d`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nothing closing in the next 30 days</p>
                )}
              </CardContent>
            </Card>
          </div>

          {lostReasons.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Lost Reasons</CardTitle>
                <CardDescription>Why deals didn&apos;t close · {lostDeals.length} lost deals</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownTable
                  rows={lostReasons.map((r) => ({
                    label: r.label,
                    value: r.value,
                    color: '#f43f5e',
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TASKS ── */}
        <TabsContent forceMount value="tasks" className={cn('flex-1 overflow-y-auto space-y-6 mt-0', activeTab !== 'tasks' && 'hidden')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tasks"   value={totals.tasks}   icon={CheckSquare} color="text-blue-500"   bg="bg-blue-50 dark:bg-blue-950/40"   sub={`${completionRate}% complete`} />
            <StatCard label="Open"          value={openTasks}      icon={CheckSquare} color="text-amber-500"  bg="bg-amber-50 dark:bg-amber-950/40" />
            <StatCard label="Unassigned"    value={unassignedOpen} icon={AlertCircle} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-950/40" />
            <StatCard label="Urgent"        value={urgentTasks}    icon={AlertCircle} color="text-red-500"    bg="bg-red-50 dark:bg-red-950/40" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Tasks per Project</CardTitle>
              <CardDescription>Total shown above each bar · hover for status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <StackedBarWithTotals data={tasksPerProject} config={statusConfig} keys={statusKeys} height={280} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
                <CardDescription>{tasks.length} tasks across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutWithBreakdown data={taskStatusData} config={statusConfig} total={tasks.length} label="tasks" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Priority Breakdown</CardTitle>
                <CardDescription>Count shown above each bar</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={priorityConfig} className="h-[260px] w-full">
                  <BarChart data={priorityData} barSize={48} margin={{ top: 24, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid vertical={false} {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <ChartTooltip cursor={{ fill: 'hsl(var(--muted))', radius: 6 }} content={<ChartTooltipContent hideLabel />} />
                    {(['low','medium','high','urgent'] as const).map((key) => (
                      <Bar key={key} dataKey={key} fill={`var(--color-${key})`} {...animProps} radius={[4,4,0,0]}>
                        <LabelList dataKey={key} position="top"
                          style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--foreground))' }} />
                      </Bar>
                    ))}
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── PROJECTS ── */}
        <TabsContent forceMount value="projects" className={cn('flex-1 overflow-y-auto space-y-6 mt-0', activeTab !== 'projects' && 'hidden')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Projects" value={totals.projects} icon={FolderKanban} color="text-blue-500"   bg="bg-blue-50 dark:bg-blue-950/40" />
            <StatCard label="Active"         value={projects.filter((p) => p.status === 'active').length}    icon={FolderKanban} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/40" />
            <StatCard label="On Hold"        value={projects.filter((p) => p.status === 'on_hold').length}   icon={FolderKanban} color="text-amber-500"  bg="bg-amber-50 dark:bg-amber-950/40" />
            <StatCard label="Clients"        value={totals.clients}  icon={Building2}    color="text-violet-500" bg="bg-violet-50 dark:bg-violet-950/40" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Project Status</CardTitle>
                <CardDescription>{projects.length} total projects</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutWithBreakdown data={projectStatusData} config={projectStatusConfig} total={projects.length} label="projects" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Projects per Client</CardTitle>
                <CardDescription>Count shown above each bar</CardDescription>
              </CardHeader>
              <CardContent>
                <StackedBarWithTotals data={projectsPerClient} config={projectStatusConfig} keys={projectKeys} height={260} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Task Load per Project</CardTitle>
              <CardDescription>Which projects have the most work remaining</CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownTable
                rows={tasksPerProject.map((p) => ({
                  label: p.name as string,
                  value: (p.backlog as number) + (p.in_progress as number) + (p.in_review as number),
                  color: 'hsl(var(--chart-1))',
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TEAM ── */}
        <TabsContent forceMount value="team" className={cn('flex-1 overflow-y-auto space-y-6 mt-0', activeTab !== 'team' && 'hidden')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Team Members"   value={totals.users}    icon={Users}       color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-950/40" />
            <StatCard label="Assigned Tasks" value={tasks.filter((t) => t.assignee_id).length} icon={CheckSquare} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-950/40" />
            <StatCard label="Unassigned"     value={unassignedOpen}  icon={AlertCircle} color="text-amber-500"   bg="bg-amber-50 dark:bg-amber-950/40" />
            <StatCard label="Completion"     value={`${completionRate}%`} icon={TrendingUp} color="text-violet-500" bg="bg-violet-50 dark:bg-violet-950/40" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Team Workload</CardTitle>
              <CardDescription>Total shown above each bar · hover for status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <StackedBarWithTotals data={tasksPerUser} config={statusConfig} keys={statusKeys} height={260} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Open Tasks per Person</CardTitle>
              <CardDescription>Excludes completed tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownTable
                rows={tasksPerUser.map((u) => ({
                  label: u.name as string,
                  value: (u.backlog as number) + (u.in_progress as number) + (u.in_review as number),
                  color: 'hsl(var(--chart-1))',
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
