export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*, contacts(id, full_name, email, is_primary)')
    .order('name')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients?.length ?? 0} clients</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Link>
        </Button>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const primary = client.contacts?.find((c: { is_primary: boolean }) => c.is_primary)
              ?? client.contacts?.[0]
            return (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-violet-600 font-semibold text-lg">
                    {client.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{client.name}</p>
                    {primary?.full_name && (
                      <p className="text-sm text-muted-foreground truncate">{primary.full_name}</p>
                    )}
                    {primary?.email && (
                      <p className="text-xs text-muted-foreground truncate">{primary.email}</p>
                    )}
                    {client.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{client.description}</p>
                    )}
                    {client.tags && client.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {client.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="font-normal text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {client.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{client.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium mb-1">No clients yet</p>
          <p className="text-sm mb-4">Add your first client to start tracking work</p>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
