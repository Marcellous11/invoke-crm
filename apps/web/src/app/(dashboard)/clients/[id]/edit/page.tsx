import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientForm } from '@/components/clients/ClientForm'
import { updateClientAction } from '@/app/actions/clients'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const action = updateClientAction.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {client.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
          <CardDescription>Update {client.name}&apos;s details</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm action={action} defaultValues={client} submitLabel="Save changes" />
        </CardContent>
      </Card>
    </div>
  )
}
