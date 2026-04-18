import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, FolderKanban, Plus, Globe, Phone, MapPin, Building2, Users as UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'
import { ContactList } from '@/components/contacts/ContactList'
import { ActivityComposer } from '@/components/activities/ActivityComposer'
import { ActivityTimeline } from '@/components/activities/ActivityTimeline'
import type { Contact, Activity } from '@invoke/types'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: client }, { data: projects }, { data: contacts }, { data: activities }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('projects')
      .select('id, title, status, start_date, end_date')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contacts')
      .select('*')
      .eq('client_id', id)
      .order('created_at'),
    supabase
      .from('activities')
      .select('*, author:users!activities_created_by_fkey(id, full_name, avatar_url)')
      .eq('client_id', id)
      .order('occurred_at', { ascending: false })
      .limit(50),
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
            {client.tags && client.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {client.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
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

      {/* Company info */}
      {(client.website || client.phone || client.industry || client.company_size || client.address) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-0 text-sm">
            {client.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {client.website}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
              </div>
            )}
            {client.industry && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                {client.industry}
              </div>
            )}
            {client.company_size && (
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                {client.company_size} employees
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {client.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-wrap">{client.notes}</CardContent>
        </Card>
      )}

      {/* Contacts */}
      <div className="mb-8">
        <ContactList clientId={id} contacts={(contacts as Contact[]) ?? []} />
      </div>

      {/* Activity */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Activity</h2>
        <div className="space-y-4">
          <ActivityComposer clientId={id} />
          <ActivityTimeline
            activities={(activities as Activity[]) ?? []}
            currentUserId={authUser!.id}
            clientId={id}
          />
        </div>
      </div>

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
