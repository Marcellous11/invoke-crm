import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientForm } from '@/components/clients/ClientForm'
import { createClientAction } from '@/app/actions/clients'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Clients
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Client</CardTitle>
          <CardDescription>Add a client to assign projects to</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm action={createClientAction} submitLabel="Create client" />
        </CardContent>
      </Card>
    </div>
  )
}
