'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ExternalLink } from 'lucide-react'
import { createTaskAction, updateTaskAction, deleteTaskAction } from '@/app/actions/tasks'
import type { Task, TaskStatus, TaskPriority, User } from '@invoke/types'

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

interface TaskModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  defaultStatus?: TaskStatus
  task?: Task
  members: Pick<User, 'id' | 'full_name' | 'email'>[]
  onSave: (task: Task) => void
  onDelete?: (taskId: string) => void
}

export function TaskModal({
  open,
  onClose,
  projectId,
  defaultStatus = 'backlog',
  task,
  members,
  onSave,
  onDelete,
}: TaskModalProps) {
  const isEditing = !!task
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    setError(null)
    startTransition(async () => {
      if (isEditing) {
        const result = await updateTaskAction(task.id, projectId, {
          title: data.get('title') as string,
          description: data.get('description') as string || null,
          status: data.get('status') as TaskStatus,
          priority: data.get('priority') as TaskPriority,
          assignee_id: (data.get('assignee_id') as string) || null,
          due_date: (data.get('due_date') as string) || null,
          start_date: (data.get('start_date') as string) || null,
        })
        if (result?.error) { setError(result.error); return }
        onSave({
          ...task,
          title: data.get('title') as string,
          description: data.get('description') as string || null,
          status: data.get('status') as TaskStatus,
          priority: data.get('priority') as TaskPriority,
          assignee_id: (data.get('assignee_id') as string) || null,
          due_date: (data.get('due_date') as string) || null,
          start_date: (data.get('start_date') as string) || null,
        })
      } else {
        const result = await createTaskAction({
          projectId,
          title: data.get('title') as string,
          description: data.get('description') as string || undefined,
          status: data.get('status') as TaskStatus,
          priority: data.get('priority') as TaskPriority,
          assignee_id: (data.get('assignee_id') as string) || undefined,
          due_date: (data.get('due_date') as string) || undefined,
          start_date: (data.get('start_date') as string) || undefined,
        })
        if (result?.error) { setError(result.error); return }
        if (result?.task) onSave(result.task as Task)
      }
      onClose()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTaskAction(task!.id, projectId)
      onDelete?.(task!.id)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setConfirmDelete(false) } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
            {isEditing && task && (
              <Link
                href={`/tasks/${task.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-4"
              >
                <ExternalLink className="h-3 w-3" />
                Open full view
              </Link>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input id="title" name="title" defaultValue={task?.title} required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={task?.description ?? ''} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={task?.status ?? defaultStatus}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={task?.priority ?? 'medium'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assignee_id">Assignee</Label>
            <select
              id="assignee_id"
              name="assignee_id"
              defaultValue={task?.assignee_id ?? ''}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" defaultValue={task?.start_date ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ''} />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-2">
            {isEditing && !confirmDelete && (
              <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}>
                Delete task
              </Button>
            )}
            {isEditing && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Sure?</span>
                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            )}
            {!confirmDelete && (
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Save changes' : 'Create task'}
                </Button>
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
