'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, StickyNote, Phone, Mail, Users, CheckSquare } from 'lucide-react'
import { createActivityAction } from '@/app/actions/activities'
import type { ActivityType } from '@invoke/types'

interface ActivityComposerProps {
  clientId?: string | null
  contactId?: string | null
  projectId?: string | null
}

const TYPES: { value: ActivityType; label: string; icon: typeof StickyNote }[] = [
  { value: 'note',    label: 'Note',    icon: StickyNote },
  { value: 'call',    label: 'Call',    icon: Phone },
  { value: 'email',   label: 'Email',   icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'task',    label: 'Task',    icon: CheckSquare },
]

export function ActivityComposer({ clientId, contactId, projectId }: ActivityComposerProps) {
  const [type, setType] = useState<ActivityType>('note')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('type', type)

    setError(null)
    startTransition(async () => {
      const result = await createActivityAction(
        { clientId, contactId, projectId },
        data
      )
      if (result?.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      {/* Type selector */}
      <div className="flex flex-wrap gap-1">
        {TYPES.map(({ value, label, icon: Icon }) => {
          const active = type === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          )
        })}
      </div>

      <Input
        name="subject"
        placeholder={subjectPlaceholder(type)}
        required
        disabled={isPending}
      />

      <Textarea
        name="body"
        placeholder="Details (optional)"
        rows={2}
        disabled={isPending}
      />

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Log {TYPES.find((t) => t.value === type)?.label.toLowerCase()}
        </Button>
      </div>
    </form>
  )
}

function subjectPlaceholder(type: ActivityType) {
  switch (type) {
    case 'call':    return 'Quick headline — e.g., "Kickoff call with Rachel"'
    case 'email':   return 'Subject line or short summary'
    case 'meeting': return 'Meeting title — e.g., "Q3 planning"'
    case 'task':    return 'What did you do?'
    default:        return 'What do you want to remember?'
  }
}
