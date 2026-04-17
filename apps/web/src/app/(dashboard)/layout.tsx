import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { NavigationProgress } from '@/components/shared/NavigationProgress'
import { CommandPalette } from '@/components/shared/CommandPalette'
import type { User } from '@invoke/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [
    { data: profile },
    { data: projects },
    { data: clients },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', authUser.id).single(),
    supabase.from('projects').select('id, title, status').order('title'),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('tasks').select('id, title, project_id, project:projects(title)').order('title').limit(200),
  ])

  const user: User = profile ?? {
    id: authUser.id,
    email: authUser.email ?? '',
    full_name: authUser.user_metadata?.full_name ?? '',
    avatar_url: null,
    role: 'member',
    created_at: authUser.created_at,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NavigationProgress />
      <CommandPalette
        projects={projects ?? []}
        clients={clients ?? []}
        tasks={(tasks ?? []) as { id: string; title: string; project_id: string; project?: { title: string } | null }[]}
      />
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
