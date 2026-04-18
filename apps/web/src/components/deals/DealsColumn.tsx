'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './DealCard'
import { cn } from '@/lib/utils'
import type { Deal, DealStage } from '@invoke/types'

const STAGE_COLORS: Record<DealStage, string> = {
  lead:        'bg-slate-500',
  qualified:   'bg-blue-500',
  proposal:    'bg-violet-500',
  negotiation: 'bg-amber-500',
  won:         'bg-emerald-500',
  lost:        'bg-rose-500',
}

function formatTotal(deals: Deal[]) {
  const currencies = new Set(deals.map((d) => d.currency))
  if (currencies.size !== 1) return null
  const currency = [...currencies][0]
  const total = deals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0)
  if (total === 0) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(total / 100)
  } catch {
    return `${currency} ${(total / 100).toLocaleString()}`
  }
}

interface DealsColumnProps {
  id: DealStage
  title: string
  deals: Deal[]
}

export function DealsColumn({ id, title, deals }: DealsColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const total = formatTotal(deals)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('h-2 w-2 rounded-full shrink-0', STAGE_COLORS[id])} />
          <span className="text-sm font-semibold truncate">{title}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
            {deals.length}
          </span>
        </div>
        {total && (
          <span className="text-xs font-medium text-muted-foreground shrink-0">{total}</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[200px] transition-colors',
          isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/40'
        )}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground/50 py-6">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  )
}
