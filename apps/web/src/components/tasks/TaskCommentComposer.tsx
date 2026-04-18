'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { createTaskCommentAction } from '@/app/actions/tasks'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Props { taskId: string }

export function TaskCommentComposer({ taskId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = (fd.get('body') as string)?.trim()
    if (!body) return

    setError(null)
    startTransition(async () => {
      const res = await createTaskCommentAction(taskId, fd)
      if (res?.error) { setError(res.error); return }
      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        name="body"
        placeholder="Leave a comment…"
        rows={3}
        required
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.currentTarget.form?.requestSubmit()
          }
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">⌘+Enter to post</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
            Post comment
          </Button>
        </div>
      </div>
    </form>
  )
}
