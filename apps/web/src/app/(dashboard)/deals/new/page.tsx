import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DealForm } from '@/components/deals/DealForm'
import { createDealAction } from '@/app/actions/deals'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; client_id?: string }>
}) {
  const { stage, client_id } = await searchParams
  const supabase = await createClient()

  const [{ data: clients }, { data: contacts }, { data: users }] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('contacts').select('id, full_name, client_id, is_primary'),
    supabase.from('users').select('id, full_name').order('full_name'),
  ])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Deals
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Deal</CardTitle>
          <CardDescription>Track an opportunity through the pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <DealForm
            action={createDealAction}
            defaultValues={{
              stage: (stage as never) ?? 'lead',
              client_id: client_id ?? '',
              currency: 'USD',
            }}
            clients={clients ?? []}
            contacts={contacts ?? []}
            users={users ?? []}
            submitLabel="Create deal"
          />
        </CardContent>
      </Card>
    </div>
  )
}
