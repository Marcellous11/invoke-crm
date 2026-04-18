'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createSubtaskAction, toggleSubtaskDoneAction } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'
import type { Task } from '@invoke/types'

interface SubtaskListProps {
  parentTaskId: string
  subtasks: Task[]
}

export function SubtaskList({ parentTaskId, subtasks }: SubtaskListProps) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const done = subtasks.filter((s) => s.status === 'done').length
  const total = subtasks.length

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const res = await createSubtaskAction(parentTaskId, trimmed)
      if (res?.error) { setError(res.error); return }
      setTitle('')
      setAdding(false)
    })
  }

  function handleToggle(subtaskId: string) {
    startTransition(async () => {
      await toggleSubtaskDoneAction(subtaskId, parentTaskId)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">
          Subtasks{total > 0 && <span className="text-muted-foreground font-normal ml-2">{done} / {total}</span>}
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Add subtask
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="border rounded-lg divide-y">
          {subtasks.map((s) => {
            const checked = s.status === 'done'
            return (
              <div
                key={s.id}
                className={cn('flex items-center gap-3 px-3 py-2 hover:bg-muted/40 transition-colors', isPending && 'opacity-80')}
              >
                <button
                  onClick={() => handleToggle(s.id)}
                  disabled={isPending}
                  className={cn(
                    'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    checked
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-muted-foreground/40 hover:border-primary',
                  )}
                  aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
                >
                  {checked && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className={cn('text-sm flex-1 min-w-0 truncate', checked && 'line-through text-muted-foreground')}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setAdding(false); setTitle(''); setError(null) } }}
            placeholder="Subtask title…"
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setTitle(''); setError(null) }}
            className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </form>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      {total === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No subtasks yet.</p>
      )}
    </div>
  )
}
