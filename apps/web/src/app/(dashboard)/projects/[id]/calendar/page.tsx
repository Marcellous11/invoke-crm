import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectCalendar } from '@/components/calendar/ProjectCalendar'
import type { Task, User } from '@invoke/types'

export default async function CalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: tasks }, { data: members }] = await Promise.all([
    supabase.from('projects').select('id, title').eq('id', id).single(),
    supabase.from('tasks').select('*').eq('project_id', id).order('due_date'),
    supabase
      .from('project_members')
      .select(`user:users ( id, full_name, avatar_url, email )`)
      .eq('project_id', id),
  ])

  if (!project) notFound()

  const memberUsers = (members ?? [])
    .map((m) => m.user)
    .flat()
    .filter(Boolean) as Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-background shrink-0">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {project.title}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">Calendar</span>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <ProjectCalendar
          tasks={(tasks ?? []) as Task[]}
          projectId={id}
          members={memberUsers}
        />
      </div>
    </div>
  )
}
