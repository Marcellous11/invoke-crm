import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Kanban, Calendar, GanttChart, ArrowLeft, Pencil } from 'lucide-react'
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton'
import { MembersPanel } from '@/components/projects/MembersPanel'
import { ProjectDescription } from '@/components/projects/ProjectDescription'
import { ProjectTaskTable } from '@/components/projects/ProjectTaskTable'
import type { ProjectMember, Task, User } from '@invoke/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: project }, { data: members }, { data: allUsers }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select(`*, clients ( id, name )`).eq('id', id).single(),
    supabase
      .from('project_members')
      .select(`project_id, user_id, role, user:users ( id, full_name, avatar_url, email )`)
      .eq('project_id', id),
    supabase.from('users').select('id, full_name, avatar_url, email').order('full_name'),
    supabase
      .from('tasks')
      .select(`*, assignee:users!tasks_assignee_id_fkey ( id, full_name, avatar_url )`)
      .eq('project_id', id)
      .order('status')
      .order('position'),
  ])

  if (!project) notFound()

  const views = [
    { href: `/projects/${id}/board`, label: 'Kanban', icon: Kanban },
    { href: `/projects/${id}/calendar`, label: 'Calendar', icon: Calendar },
    { href: `/projects/${id}/timeline`, label: 'Timeline', icon: GanttChart },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            {/* View nav pills */}
            <div className="flex items-center gap-1">
              {views.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {project.clients && !Array.isArray(project.clients) && (
            <p className="text-sm text-muted-foreground mt-1">
              Client:{' '}
              <Link
                href={`/clients/${(project.clients as unknown as { id: string; name: string }).id}`}
                className="text-primary hover:underline"
              >
                {(project.clients as unknown as { id: string; name: string }).name}
              </Link>
            </p>
          )}

          <ProjectDescription projectId={id} initialDescription={project.description} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
          <DeleteProjectButton id={id} />
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task table — takes up 3 of 4 columns */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tasks</h2>
          <ProjectTaskTable
            initialTasks={(tasks ?? []) as (Task & { assignee: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null })[]}
            projectId={id}
            members={(allUsers ?? []) as Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]}
          />
        </div>

        {/* Members panel — right column */}
        <div className="lg:col-span-1">
          <MembersPanel
            projectId={id}
            members={(members ?? []) as unknown as (ProjectMember & { user: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'> })[]}
            allUsers={(allUsers ?? []) as unknown as Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]}
            currentUserId={authUser!.id}
          />
        </div>
      </div>
    </div>
  )
}
