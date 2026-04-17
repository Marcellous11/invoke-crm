import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, FolderKanban, Plus, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('projects')
      .select('id, title, status, start_date, end_date')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  const statusMap: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700' },
    completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
    on_hold: { label: 'On Hold', className: 'bg-amber-100 text-amber-700' },
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-2xl shrink-0">
            {client.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.description && (
              <p className="text-muted-foreground mt-1">{client.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
          <DeleteClientButton id={id} />
        </div>
      </div>

      {/* Contact info */}
      {(client.contact_name || client.contact_email) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 pt-0">
            {client.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                {client.contact_name}
              </div>
            )}
            {client.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.contact_email}`} className="text-primary hover:underline">
                  {client.contact_email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Projects ({projects?.length ?? 0})</h2>
        <Button size="sm" asChild>
          <Link href={`/projects/new?client_id=${id}`}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map((project) => {
            const status = statusMap[project.status] ?? { label: project.status, className: 'bg-muted text-muted-foreground' }
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium flex-1 truncate">{project.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground border rounded-lg">
          <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No projects yet for this client.</p>
        </div>
      )}
    </div>
  )
}
