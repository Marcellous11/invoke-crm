import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DealForm } from '@/components/deals/DealForm'
import { updateDealAction } from '@/app/actions/deals'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('*').eq('id', id).single()
  if (!deal) notFound()

  const [{ data: clients }, { data: contacts }, { data: users }] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('contacts').select('id, full_name, client_id, is_primary'),
    supabase.from('users').select('id, full_name').order('full_name'),
  ])

  const action = updateDealAction.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/deals/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {deal.title}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Deal</CardTitle>
          <CardDescription>Update {deal.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <DealForm
            action={action}
            defaultValues={deal}
            clients={clients ?? []}
            contacts={contacts ?? []}
            users={users ?? []}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  )
}
