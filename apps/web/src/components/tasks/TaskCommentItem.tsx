'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { updateTaskCommentAction, deleteTaskCommentAction } from '@/app/actions/tasks'
import { formatDistanceToNow } from 'date-fns'
import type { TaskComment } from '@invoke/types'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  comment: TaskComment
  taskId: string
  canEdit: boolean
}

export function TaskCommentItem({ comment, taskId, canEdit }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [body, setBody] = useState(comment.body)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const name = comment.author?.full_name ?? 'Unknown'
  const when = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })

  function handleSave() {
    const trimmed = body.trim()
    if (!trimmed) return
    setError(null)
    startTransition(async () => {
      const res = await updateTaskCommentAction(comment.id, taskId, trimmed)
      if (res?.error) { setError(res.error); return }
      setEditing(false)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTaskCommentAction(comment.id, taskId)
      if (res?.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={comment.author?.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{when}</span>
          {comment.edited_at && <span className="text-xs text-muted-foreground">(edited)</span>}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={isPending || !body.trim()}>
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(comment.body); setError(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="group">
            <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
            {canEdit && (
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!confirmDel ? (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Delete comment?</span>
                    <button
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      {isPending ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDel(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
