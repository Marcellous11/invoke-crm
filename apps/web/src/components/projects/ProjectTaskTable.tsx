'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { updateTaskAction } from '@/app/actions/tasks'
import { isPast, isToday, isTomorrow, parseISO, format } from 'date-fns'
import { CheckSquare, Kanban, ChevronsUpDown, Check, CalendarIcon } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, User } from '@invoke/types'

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── types ────────────────────────────────────────────────────────────────────

type Assignee = Pick<User, 'id' | 'full_name' | 'avatar_url'>
type TaskWithAssignee = Task & { assignee: Assignee | null }
type Member = Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>
type TaskPatch = {
  title?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string | null
  assignee?: Assignee | null
  due_date?: string | null
}

// ─── constants ────────────────────────────────────────────────────────────────

const STATUSES: { id: TaskStatus; label: string; cls: string }[] = [
  { id: 'backlog',     label: 'Backlog',     cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'in_review',   label: 'In Review',   cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { id: 'done',        label: 'Done',        cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

const PRIORITIES: { id: TaskPriority; label: string; dot: string; text: string }[] = [
  { id: 'low',    label: 'Low',    dot: 'bg-slate-400',  text: 'text-slate-500' },
  { id: 'medium', label: 'Medium', dot: 'bg-blue-500',   text: 'text-blue-600' },
  { id: 'high',   label: 'High',   dot: 'bg-amber-500',  text: 'text-amber-600' },
  { id: 'urgent', label: 'Urgent', dot: 'bg-red-500',    text: 'text-red-600' },
]

function dueDateLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', cls: 'text-red-500 font-medium' }
  if (isToday(d))    return { label: 'Today',    cls: 'text-amber-500 font-medium' }
  if (isTomorrow(d)) return { label: 'Tomorrow', cls: 'text-blue-500' }
  return { label: format(d, 'MMM d'), cls: 'text-muted-foreground' }
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── status cell ──────────────────────────────────────────────────────────────

function StatusCell({ task, onChange }: { task: TaskWithAssignee; onChange: (v: TaskStatus) => void }) {
  const current = STATUSES.find((s) => s.id === task.status) ?? STATUSES[0]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity', current.cls)}>
          {current.label}
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {STATUSES.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => onChange(s.id)} className="gap-2">
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', s.cls)}>{s.label}</span>
            {s.id === task.status && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── priority cell ────────────────────────────────────────────────────────────

function PriorityCell({ task, onChange }: { task: TaskWithAssignee; onChange: (v: TaskPriority) => void }) {
  const current = PRIORITIES.find((p) => p.id === task.priority) ?? PRIORITIES[1]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn('flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity capitalize', current.text)}>
          <span className={cn('h-2 w-2 rounded-full shrink-0', current.dot)} />
          {current.label}
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {PRIORITIES.map((p) => (
          <DropdownMenuItem key={p.id} onClick={() => onChange(p.id)} className="gap-2">
            <span className={cn('h-2 w-2 rounded-full shrink-0', p.dot)} />
            <span className={p.text}>{p.label}</span>
            {p.id === task.priority && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── assignee cell ────────────────────────────────────────────────────────────

function AssigneeCell({ task, members, onChange }: {
  task: TaskWithAssignee
  members: Member[]
  onChange: (userId: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto px-1.5 py-1 font-normal justify-start gap-2 -ml-1.5">
          {task.assignee ? (
            <>
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                {initials(task.assignee.full_name || '?')}
              </span>
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">{task.assignee.full_name}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">Unassigned</span>
          )}
          <ChevronsUpDown className="h-3 w-3 opacity-40 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => { onChange(null); setOpen(false) }}
                className="gap-2 text-muted-foreground italic"
              >
                <span className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0" />
                Unassigned
                {!task.assignee && <Check className="h-3 w-3 ml-auto" />}
              </CommandItem>
              {members.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.full_name || m.email}
                  onSelect={() => { onChange(m.id); setOpen(false) }}
                  className="gap-2"
                >
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                    {initials(m.full_name || m.email)}
                  </span>
                  <span className="truncate">{m.full_name || m.email}</span>
                  {task.assignee?.id === m.id && <Check className="h-3 w-3 ml-auto" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── due date cell ────────────────────────────────────────────────────────────

function DueDateCell({ task, onChange }: { task: TaskWithAssignee; onChange: (v: string | null) => void }) {
  const [editing, setEditing] = useState(false)
  const due = task.due_date ? dueDateLabel(task.due_date) : null

  if (editing) {
    return (
      <Input
        type="date"
        autoFocus
        defaultValue={task.due_date ?? ''}
        className="h-7 text-xs w-[130px] px-2"
        onBlur={(e) => {
          setEditing(false)
          const val = e.target.value
          if (val !== (task.due_date ?? '')) onChange(val || null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false)
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 text-left group"
    >
      <CalendarIcon className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      {due ? (
        <span className={cn('text-xs', due.cls)}>{due.label}</span>
      ) : (
        <span className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground italic transition-colors">Set date</span>
      )}
    </button>
  )
}

// ─── title cell ───────────────────────────────────────────────────────────────

function TitleCell({ task, onChange }: { task: TaskWithAssignee; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const done = task.status === 'done'

  if (editing) {
    return (
      <Input
        autoFocus
        defaultValue={task.title}
        className="h-7 text-sm font-medium px-2 py-0"
        onBlur={(e) => {
          setEditing(false)
          const val = e.target.value.trim()
          if (val && val !== task.title) onChange(val)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false)
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'text-sm font-medium cursor-text hover:text-primary transition-colors',
        done && 'line-through text-muted-foreground',
      )}
    >
      {task.title}
    </span>
  )
}

// ─── task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, members, onUpdate, onToggle }: {
  task: TaskWithAssignee
  members: Member[]
  onUpdate: (id: string, patch: TaskPatch) => void
  onToggle: (id: string, newStatus: 'done' | 'backlog') => void
}) {
  const [, startTransition] = useTransition()
  const done = task.status === 'done'

  function save(patch: Parameters<typeof updateTaskAction>[2]) {
    startTransition(async () => { await updateTaskAction(task.id, task.project_id, patch) })
  }

  function handleCheck() {
    const newStatus = done ? 'backlog' : 'done'
    save({ status: newStatus })
    onToggle(task.id, newStatus)
  }

  return (
    <tr className={cn('border-b last:border-0 hover:bg-muted/30 transition-colors', done && 'opacity-60')}>
      {/* Checkbox */}
      <td className="w-10 pl-4 py-3">
        <button
          onClick={handleCheck}
          className={cn(
            'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
            done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30 hover:border-primary',
          )}
        >
          {done && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </td>

      {/* Title */}
      <td className="py-2.5 pr-4">
        <TitleCell task={task} onChange={(title) => { save({ title }); onUpdate(task.id, { title }) }} />
      </td>

      {/* Status */}
      <td className="py-2.5 pr-4 hidden sm:table-cell">
        <StatusCell task={task} onChange={(status) => { save({ status }); onUpdate(task.id, { status }) }} />
      </td>

      {/* Priority */}
      <td className="py-2.5 pr-4 hidden md:table-cell">
        <PriorityCell task={task} onChange={(priority) => { save({ priority }); onUpdate(task.id, { priority }) }} />
      </td>

      {/* Assignee */}
      <td className="py-2.5 pr-2 hidden md:table-cell">
        <AssigneeCell
          task={task}
          members={members}
          onChange={(assignee_id) => {
            save({ assignee_id })
            const found = assignee_id ? members.find((m) => m.id === assignee_id) : undefined
            const assignee = found
              ? { id: found.id, full_name: found.full_name, avatar_url: found.avatar_url }
              : null
            onUpdate(task.id, { assignee_id, assignee })
          }}
        />
      </td>

      {/* Due date */}
      <td className="py-2.5 pr-4 hidden lg:table-cell">
        <DueDateCell task={task} onChange={(due_date) => { save({ due_date }); onUpdate(task.id, { due_date }) }} />
      </td>
    </tr>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface ProjectTaskTableProps {
  initialTasks: TaskWithAssignee[]
  projectId: string
  members: Member[]
}

export function ProjectTaskTable({ initialTasks, projectId, members }: ProjectTaskTableProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [showDone, setShowDone] = useState(false)

  function handleUpdate(taskId: string, patch: TaskPatch) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...patch } as TaskWithAssignee : t))
  }

  function handleToggle(taskId: string, newStatus: 'done' | 'backlog') {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')
  const rowProps = { members, onUpdate: handleUpdate, onToggle: handleToggle }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-xl bg-card">
        <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="text-xs mt-1">
          Open the{' '}
          <Link href={`/projects/${projectId}/board`} className="text-primary hover:underline">
            Kanban board
          </Link>{' '}
          to add tasks.
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="w-10 pl-4 py-2.5" />
            <th className="py-2.5 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Task</th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Status</th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Priority</th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Assignee</th>
            <th className="py-2.5 pr-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Due</th>
          </tr>
        </thead>
        <tbody>
          {open.map((task) => <TaskRow key={task.id} task={task} {...rowProps} />)}
        </tbody>
      </table>

      {done.length > 0 && (
        <div className="border-t">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:bg-muted/30 transition-colors text-left"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {showDone ? 'Hide' : 'Show'} completed ({done.length})
          </button>
          {showDone && (
            <table className="w-full">
              <tbody>
                {done.map((task) => <TaskRow key={task.id} task={task} {...rowProps} />)}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="border-t px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {open.length} open · {done.length} completed
        </span>
        <Link
          href={`/projects/${projectId}/board`}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Kanban className="h-3.5 w-3.5" />
          Open Kanban board
        </Link>
      </div>
    </div>
  )
}
