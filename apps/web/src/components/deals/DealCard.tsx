'use client'

import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GripVertical, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Deal } from '@invoke/types'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatValue(cents: number | null, currency: string) {
  if (cents == null) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toLocaleString()}`
  }
}

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
}

export function DealCard({ deal, isDragging = false }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: deal.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const value = formatValue(deal.value_cents, deal.currency)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-card border rounded-lg p-3 hover:shadow-md transition-all select-none',
        (isDragging || isSortableDragging) && 'opacity-40 shadow-lg'
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Link href={`/deals/${deal.id}`} className="flex-1 min-w-0 block">
          <p className="text-sm font-medium leading-snug line-clamp-2">{deal.title}</p>

          {deal.client && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{deal.client.name}</p>
          )}

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              {value && (
                <span className="font-semibold">{value}</span>
              )}
              {deal.probability != null && (
                <span className="text-muted-foreground">{deal.probability}%</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {deal.expected_close_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(deal.expected_close_date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
              {deal.owner && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={deal.owner.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(deal.owner.full_name || '?')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
