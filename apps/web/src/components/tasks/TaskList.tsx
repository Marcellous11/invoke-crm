'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { updateTaskAction } from '@/app/actions/tasks'
import { FolderKanban, Calendar, ChevronDown, ChevronRight, CheckSquare } from 'lucide-react'
import type { Task } from '@invoke/types'
import { isPast, isToday, isTomorrow, parseISO } from 'date-fns'

type TaskWithProject = Task & { project: { id: string; title: string } | null }

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-slate-400',
  medium: 'bg-blue-500',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
}

function dueDateLabel(dateStr: string): { label: string; className: string } {
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', className: 'text-red-600 font-medium' }
  if (isToday(d))               return { label: 'Today',   className: 'text-amber-600 font-medium' }
  if (isTomorrow(d))            return { label: 'Tomorrow', className: 'text-blue-600' }
  return {
    label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    className: 'text-muted-foreground',
  }
}

function TaskRow({ task, onComplete }: { task: TaskWithProject; onComplete: (id: string) => void }) {
  const [isPending, startTransition] = useTransition()

  function handleCheck() {
    startTransition(async () => {
      await updateTaskAction(task.id, task.project_id, { status: 'done' })
      onComplete(task.id)
    })
  }

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors group',
      isPending && 'opacity-50'
    )}>
      {/* Checkbox */}
      <button
        onClick={handleCheck}
        disabled={isPending}
        className="mt-0.5 h-5 w-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center shrink-0 transition-colors group-hover:border-primary/60"
      >
        <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-primary/20 transition-colors" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-snug">{task.title}</span>
          <div className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', PRIORITY_DOT[task.priority])} title={task.priority} />
        </div>

        <div className="flex items-center gap-3 mt-1">
          {task.project && (
            <Link
              href={`/projects/${task.project.id}/board`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <FolderKanban className="h-3 w-3" />
              {task.project.title}
            </Link>
          )}
          {task.due_date && (
            <span className={cn('flex items-center gap-1 text-xs', dueDateLabel(task.due_date).className)}>
              <Calendar className="h-3 w-3" />
              {dueDateLabel(task.due_date).label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function DoneRow({ task }: { task: TaskWithProject }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 rounded-lg opacity-50">
      <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm line-through text-muted-foreground">{task.title}</span>
        {task.project && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">{task.project.title}</p>
        )}
      </div>
    </div>
  )
}

interface TaskListProps {
  openTasks: TaskWithProject[]
  doneTasks: TaskWithProject[]
}

export function TaskList({ openTasks, doneTasks }: TaskListProps) {
  const [open, setOpen] = useState<TaskWithProject[]>(openTasks)
  const [showDone, setShowDone] = useState(false)

  function handleComplete(taskId: string) {
    setOpen((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (open.length === 0 && doneTasks.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">You&apos;re all caught up</p>
        <p className="text-sm mt-1">No tasks assigned to you yet.</p>
      </div>
    )
  }

  // Group open tasks by project
  const grouped = open.reduce((acc, task) => {
    const key = task.project?.id ?? 'none'
    const label = task.project?.title ?? 'No project'
    if (!acc[key]) acc[key] = { label, tasks: [] }
    acc[key].tasks.push(task)
    return acc
  }, {} as Record<string, { label: string; tasks: TaskWithProject[] }>)

  return (
    <div className="space-y-6">
      {open.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No open tasks — you&apos;re all caught up!
        </div>
      )}

      {Object.entries(grouped).map(([projectId, { label, tasks }]) => (
        <div key={projectId}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
            <span className="text-xs text-muted-foreground">({tasks.length})</span>
          </div>
          <div className="border rounded-xl overflow-hidden divide-y">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onComplete={handleComplete} />
            ))}
          </div>
        </div>
      ))}

      {/* Completed section */}
      {doneTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-2 px-1 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
          >
            {showDone ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Completed ({doneTasks.length})
          </button>
          {showDone && (
            <div className="border rounded-xl overflow-hidden divide-y">
              {doneTasks.map((task) => (
                <DoneRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
