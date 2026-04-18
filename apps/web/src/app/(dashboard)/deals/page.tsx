export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DealsBoard } from '@/components/deals/DealsBoard'
import type { Deal } from '@invoke/types'

export default async function DealsPage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      client:clients ( id, name ),
      owner:users!deals_owner_id_fkey ( id, full_name, avatar_url )
    `)
    .order('position')

  const totalOpen = (deals ?? []).filter((d) => d.stage !== 'won' && d.stage !== 'lost').length
  const totalWon = (deals ?? []).filter((d) => d.stage === 'won').length

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Deals</h1>
            <p className="text-xs text-muted-foreground">
              {totalOpen} open · {totalWon} won
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/deals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {deals && deals.length > 0 ? (
          <DealsBoard initialDeals={(deals ?? []) as Deal[]} />
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No deals yet</p>
            <p className="text-sm mb-4">Track opportunities through your sales pipeline</p>
            <Button asChild>
              <Link href="/deals/new">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
