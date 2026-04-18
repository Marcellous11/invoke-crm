export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: totalProjects },
    { count: totalUsers },
    { data: tasks },
    { data: projects },
    { data: clients },
    { data: users },
    { data: deals },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('id, status, priority, project_id, assignee_id'),
    supabase.from('projects').select('id, title, status, client_id'),
    supabase.from('clients').select('id, name'),
    supabase.from('users').select('id, full_name'),
    supabase
      .from('deals')
      .select('id, title, stage, value_cents, currency, probability, expected_close_date, owner_id, client_id, lost_reason, created_at, updated_at'),
  ])

  return (
    <AnalyticsDashboard
      totals={{
        clients: totalClients ?? 0,
        projects: totalProjects ?? 0,
        tasks: tasks?.length ?? 0,
        users: totalUsers ?? 0,
      }}
      tasks={tasks ?? []}
      projects={projects ?? []}
      clients={clients ?? []}
      users={users ?? []}
      deals={deals ?? []}
    />
  )
}
