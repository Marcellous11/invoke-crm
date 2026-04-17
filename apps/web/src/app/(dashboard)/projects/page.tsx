export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectsFilter } from '@/components/projects/ProjectsFilter'
import Link from 'next/link'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, status, start_date, end_date, clients ( name )')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">{projects?.length ?? 0} projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <ProjectsFilter projects={(projects ?? []) as Parameters<typeof ProjectsFilter>[0]['projects']} />
    </div>
  )
}
