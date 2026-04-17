export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TaskDashboard } from '@/components/tasks/TaskDashboard'
import { redirect } from 'next/navigation'
import type { Task } from '@invoke/types'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all tasks in projects the user is a member of (RLS handles scoping)
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`*, project:projects ( id, title )`)
    .order('due_date', { ascending: true, nullsFirst: false })

  return (
    <TaskDashboard
      tasks={(tasks ?? []) as (Task & { project: { id: string; title: string } | null })[]}
      currentUserId={user.id}
    />
  )
}
