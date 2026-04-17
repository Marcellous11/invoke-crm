import { createClient } from '@/lib/supabase/server'
import { TimelineView } from '@/components/timeline/TimelineView'

export default async function TimelinePage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`id, title, status, start_date, end_date, clients ( name )`)
    .order('start_date', { ascending: true, nullsFirst: false })

  const mapped = (projects ?? []).map((p) => ({
    ...p,
    client: p.clients && !Array.isArray(p.clients)
      ? (p.clients as unknown as { name: string })
      : null,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground mt-1">All projects at a glance</p>
      </div>
      <TimelineView projects={mapped} />
    </div>
  )
}
