import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { createProjectAction } from '@/app/actions/projects'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>Create a project and assign it to a client</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={createProjectAction}
            clients={clients ?? []}
            defaultClientId={client_id}
            submitLabel="Create project"
          />
        </CardContent>
      </Card>
    </div>
  )
}
