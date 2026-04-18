import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  FolderKanban,
  MessageSquare,
  Flag,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SubtaskList } from '@/components/tasks/SubtaskList'
import { TaskAttachments, type AttachmentRow } from '@/components/tasks/TaskAttachments'
import { TaskCommentComposer } from '@/components/tasks/TaskCommentComposer'
import { TaskCommentItem } from '@/components/tasks/TaskCommentItem'
import { EditTaskButton } from '@/components/tasks/EditTaskButton'
import type { Task, TaskComment, TaskEvent, TaskStatus, User } from '@invoke/types'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  backlog:     { label: 'Backlog',     className: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  in_review:   { label: 'In Review',   className: 'bg-violet-100 text-violet-700' },
  done:        { label: 'Done',        className: 'bg-emerald-100 text-emerald-700' },
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── event rendering ──────────────────────────────────────────────────────────

function eventText(ev: TaskEvent, actorName: string, userMap: Map<string, string>): string {
  const actor = actorName || 'System'
  switch (ev.kind) {
    case 'created':
      return `${actor} created this task`
    case 'status_changed':
      return `${actor} moved status from ${prettyStatus(ev.from_value)} to ${prettyStatus(ev.to_value)}`
    case 'assignee_changed': {
      const from = ev.from_value ? userMap.get(ev.from_value) ?? 'someone' : 'Unassigned'
      const to   = ev.to_value   ? userMap.get(ev.to_value)   ?? 'someone' : 'Unassigned'
      return `${actor} changed assignee from ${from} to ${to}`
    }
    case 'priority_changed':
      return `${actor} changed priority from ${ev.from_value ?? '—'} to ${ev.to_value ?? '—'}`
    case 'due_date_changed': {
      const from = ev.from_value ? formatDate(ev.from_value) : 'none'
      const to   = ev.to_value   ? formatDate(ev.to_value)   : 'none'
      return `${actor} changed due date from ${from} to ${to}`
    }
    case 'title_changed':
      return `${actor} renamed this task`
  }
}

function prettyStatus(s: string | null) {
  if (!s) return '—'
  const meta = STATUS_META[s as TaskStatus]
  return meta?.label ?? s
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects ( id, title ),
      assignee:users!tasks_assignee_id_fkey ( id, full_name, avatar_url, email )
    `)
    .eq('id', id)
    .single()

  if (!task) notFound()

  const [{ data: subtasks }, { data: comments }, { data: attachments }, { data: events }, { data: members }] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, priority, position, project_id, parent_task_id, description, assignee_id, due_date, start_date, created_at')
        .eq('parent_task_id', id)
        .order('position'),
      supabase
        .from('task_comments')
        .select('*, author:users!task_comments_author_id_fkey(id, full_name, avatar_url)')
        .eq('task_id', id)
        .order('created_at'),
      supabase
        .from('task_attachments')
        .select('*, uploader:users!task_attachments_uploaded_by_fkey(id, full_name, avatar_url)')
        .eq('task_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('task_events')
        .select('*, actor:users!task_events_actor_id_fkey(id, full_name, avatar_url)')
        .eq('task_id', id)
        .order('created_at'),
      supabase
        .from('project_members')
        .select('user:users(id, full_name, avatar_url, email)')
        .eq('project_id', task.project_id),
    ])

  // Sign URLs for attachments (1 hour)
  const attachmentRows: AttachmentRow[] = []
  for (const a of attachments ?? []) {
    const { data: signed } = await supabase.storage
      .from('task-attachments')
      .createSignedUrl(a.storage_path, 3600)
    attachmentRows.push({
      id: a.id,
      filename: a.filename,
      size_bytes: a.size_bytes,
      mime_type: a.mime_type,
      created_at: a.created_at,
      url: signed?.signedUrl ?? null,
      uploader_name: a.uploader?.full_name ?? 'Unknown',
      can_delete: a.uploaded_by === authUser?.id,
    })
  }

  // Build user lookup map for event rendering
  const userMap = new Map<string, string>()
  for (const m of members ?? []) {
    const u = (m as unknown as { user: User | null }).user
    if (u) userMap.set(u.id, u.full_name || u.email)
  }
  if (task.assignee) userMap.set(task.assignee.id, task.assignee.full_name)

  // Combined feed: events + comments chronologically
  type FeedItem =
    | { kind: 'event';   at: string; event: TaskEvent }
    | { kind: 'comment'; at: string; comment: TaskComment }
  const feed: FeedItem[] = [
    ...(events   ?? []).map((e): FeedItem => ({ kind: 'event',   at: e.created_at, event:   e as TaskEvent })),
    ...(comments ?? []).map((c): FeedItem => ({ kind: 'comment', at: c.created_at, comment: c as TaskComment })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  const status = STATUS_META[task.status as TaskStatus]
  const due    = formatDate(task.due_date)
  const start  = formatDate(task.start_date)

  const memberList = (members ?? [])
    .map((m) => (m as unknown as { user: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'> | null }).user)
    .filter((u): u is Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'> => !!u)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href={`/projects/${task.project_id}/board`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {task.project?.title ?? 'Project'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', status.className)}>
              {status.label}
            </span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded capitalize', PRIORITY_STYLES[task.priority])}>
              <Flag className="h-3 w-3 inline mr-1" />
              {task.priority}
            </span>
            {task.project && (
              <Link
                href={`/projects/${task.project.id}/board`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <FolderKanban className="h-3 w-3" />
                {task.project.title}
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <EditTaskButton task={task as Task} members={memberList} />
        </div>
      </div>

      {/* Meta */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-0 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            {task.assignee ? (
              <span className="inline-flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">{getInitials(task.assignee.full_name || '?')}</AvatarFallback>
                </Avatar>
                {task.assignee.full_name}
              </span>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>
          {due && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              Due {due}
            </div>
          )}
          {start && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              Start {start}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {task.description && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm whitespace-pre-wrap">{task.description}</CardContent>
        </Card>
      )}

      {/* Subtasks */}
      <div className="mb-6">
        <SubtaskList parentTaskId={id} subtasks={(subtasks ?? []) as Task[]} />
      </div>

      {/* Attachments */}
      <div className="mb-6">
        <TaskAttachments taskId={id} attachments={attachmentRows} />
      </div>

      {/* Discussion */}
      <div>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Discussion
        </h2>

        <div className="mb-5">
          <TaskCommentComposer taskId={id} />
        </div>

        {feed.length > 0 ? (
          <div className="space-y-4">
            {feed.map((item, idx) => {
              if (item.kind === 'comment') {
                return (
                  <TaskCommentItem
                    key={item.comment.id}
                    comment={item.comment}
                    taskId={id}
                    canEdit={item.comment.author_id === authUser?.id}
                  />
                )
              }
              const actorName = item.event.actor?.full_name ?? ''
              return (
                <div key={`ev-${idx}`} className="flex items-center gap-3 text-xs text-muted-foreground py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span>{eventText(item.event, actorName, userMap)}</span>
                  <span className="text-muted-foreground/60">
                    · {formatDistanceToNow(new Date(item.event.created_at), { addSuffix: true })}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No activity yet. Start the discussion above.</p>
        )}
      </div>
    </div>
  )
}
