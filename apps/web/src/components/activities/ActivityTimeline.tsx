'use client'

import { useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  StickyNote,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Trash2,
  Loader2,
} from 'lucide-react'
import { deleteActivityAction } from '@/app/actions/activities'
import type { Activity, ActivityType } from '@invoke/types'

interface ActivityTimelineProps {
  activities: Activity[]
  currentUserId: string
  clientId?: string | null
  projectId?: string | null
}

const TYPE_META: Record<ActivityType, { icon: typeof StickyNote; label: string; tone: string }> = {
  note:    { icon: StickyNote,  label: 'Note',    tone: 'bg-slate-100 text-slate-600' },
  call:    { icon: Phone,       label: 'Call',    tone: 'bg-emerald-100 text-emerald-700' },
  email:   { icon: Mail,        label: 'Email',   tone: 'bg-sky-100 text-sky-700' },
  meeting: { icon: Users,       label: 'Meeting', tone: 'bg-violet-100 text-violet-700' },
  task:    { icon: CheckSquare, label: 'Task',    tone: 'bg-amber-100 text-amber-700' },
}

export function ActivityTimeline({
  activities,
  currentUserId,
  clientId,
  projectId,
}: ActivityTimelineProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Delete this activity?')) return
    setPendingId(id)
    startTransition(async () => {
      await deleteActivityAction(id, { clientId, projectId })
      setPendingId(null)
    })
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
        No activity yet. Log your first note, call, or meeting above.
      </div>
    )
  }

  return (
    <ol className="relative space-y-3 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-border">
      {activities.map((activity) => {
        const meta = TYPE_META[activity.type]
        const Icon = meta.icon
        const busy = pendingId === activity.id
        const isAuthor = activity.created_by === currentUserId

        return (
          <li key={activity.id} className="relative flex gap-3">
            <div
              className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${meta.tone}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 rounded-lg border bg-card px-3 py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{activity.subject}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                  {meta.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatRelative(activity.occurred_at)}
                </span>
                {isAuthor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDelete(activity.id)}
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-destructive" />
                    )}
                  </Button>
                )}
              </div>

              {activity.body && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {activity.body}
                </p>
              )}

              {activity.author && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={activity.author.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {activity.author.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {activity.author.full_name}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function formatRelative(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
