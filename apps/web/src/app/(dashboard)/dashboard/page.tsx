export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderKanban, Users, CheckSquare, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [projectsRes, clientsRes, tasksRes, projectsData, taskCounts, memberCounts] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'done'),
    supabase
      .from('projects')
      .select('id, title, status, end_date, clients ( name )')
      .order('created_at', { ascending: false })
      .limit(8),
    // task counts per project
    supabase
      .from('tasks')
      .select('project_id, status'),
    // member counts per project
    supabase
      .from('project_members')
      .select('project_id'),
  ])

  // Build lookup maps
  const tasksByProject: Record<string, { total: number; open: number }> = {}
  for (const t of taskCounts.data ?? []) {
    if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = { total: 0, open: 0 }
    tasksByProject[t.project_id].total++
    if (t.status !== 'done') tasksByProject[t.project_id].open++
  }

  const membersByProject: Record<string, number> = {}
  for (const m of memberCounts.data ?? []) {
    membersByProject[m.project_id] = (membersByProject[m.project_id] ?? 0) + 1
  }

  const stats = [
    { label: 'My Projects', value: projectsRes.count ?? 0, icon: FolderKanban, href: '/projects', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Clients',     value: clientsRes.count ?? 0,  icon: Users,        href: '/clients',  color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { label: 'Open Tasks',  value: tasksRes.count ?? 0,    icon: CheckSquare,  href: '/tasks',    color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your work</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`h-12 w-12 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Projects table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Projects</CardTitle>
          <Link href="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {projectsData.data && projectsData.data.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Tasks</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Members</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Due</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectsData.data.map((project, i) => {
                  const tc = tasksByProject[project.id]
                  const members = membersByProject[project.id] ?? 0
                  const clientName = project.clients && !Array.isArray(project.clients)
                    ? (project.clients as unknown as { name: string }).name
                    : '—'
                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-muted/50 transition-colors ${i !== projectsData.data!.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <td className="px-6 py-3.5">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderKanban className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {project.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{clientName}</td>
                      <td className="px-4 py-3.5 text-center">
                        {tc ? (
                          <span className="tabular-nums">
                            <span className="font-medium text-foreground">{tc.open}</span>
                            <span className="text-muted-foreground"> / {tc.total}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{members}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {project.end_date ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={project.status as string} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No projects yet.</p>
              <Link href="/projects" className="text-sm text-primary hover:underline mt-1 inline-block">
                Create your first project
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:    { label: 'Active',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
    completed: { label: 'Done',     className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    on_hold:   { label: 'On Hold',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
  }
  const { label, className } = map[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
