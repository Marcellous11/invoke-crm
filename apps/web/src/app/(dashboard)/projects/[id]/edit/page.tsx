import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { updateProjectAction } from '@/app/actions/projects'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: clients }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
  ])

  if (!project) notFound()

  const action = updateProjectAction.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {project.title}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
          <CardDescription>Update {project.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            action={action}
            clients={clients ?? []}
            defaultValues={project}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  )
}
