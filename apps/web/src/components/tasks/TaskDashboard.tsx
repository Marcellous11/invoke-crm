'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  CheckSquare, Calendar, CalendarDays, AlertCircle,
  FolderKanban, ListTodo, TrendingUp, Clock,
} from 'lucide-react'
import {
  isToday, isThisWeek, isPast, parseISO, isTomorrow, format, startOfWeek, endOfWeek,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { updateTaskAction } from '@/app/actions/tasks'
import type { Task } from '@invoke/types'

type TaskWithProject = Task & { project: { id: string; title: string } | null }

// ─── helpers ─────────────────────────────────────────────────────────────────

function dueDateMeta(dateStr: string | null) {
  if (!dateStr) return null
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return { label: 'Overdue', cls: 'text-red-500 font-medium' }
  if (isToday(d))    return { label: 'Today',    cls: 'text-amber-500 font-medium' }
  if (isTomorrow(d)) return { label: 'Tomorrow', cls: 'text-blue-500' }
  return { label: format(d, 'MMM d'), cls: 'text-muted-foreground' }
}

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-400', medium: 'bg-blue-500', high: 'bg-amber-500', urgent: 'bg-red-500',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'text-slate-500', medium: 'text-blue-600', high: 'text-amber-600', urgent: 'text-red-600',
}

// ─── single task row ──────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  showProject = true,
}: {
  task: TaskWithProject
  onToggle: (id: string, newStatus: 'done' | 'backlog') => void
  showProject?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const due = dueDateMeta(task.due_date)
  const done = task.status === 'done'

  function handleCheck() {
    const newStatus = done ? 'backlog' : 'done'
    startTransition(async () => {
      await updateTaskAction(task.id, task.project_id, { status: newStatus })
      onToggle(task.id, newStatus)
    })
  }

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group',
      pending && 'opacity-40 pointer-events-none',
    )}>
      {/* checkbox */}
      <button
        onClick={handleCheck}
        className={cn(
          'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
          done
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-muted-foreground/30 hover:border-primary group-hover:border-primary/60',
        )}
      >
        {done
          ? <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          : <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-primary/20 transition-colors"/>
        }
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium leading-snug', done && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          {showProject && task.project && (
            <Link href={`/projects/${task.project.id}/board`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <FolderKanban className="h-3 w-3" />
              {task.project.title}
            </Link>
          )}
          {due && (
            <span className={cn('flex items-center gap-1 text-xs', due.cls)}>
              <Clock className="h-3 w-3" />
              {due.label}
            </span>
          )}
          <span className={cn('text-xs capitalize', PRIORITY_LABEL[task.priority])}>
            {task.priority}
          </span>
        </div>
      </div>

      <div className={cn('h-2 w-2 rounded-full mt-2 shrink-0', PRIORITY_DOT[task.priority])} />
    </div>
  )
}

// ─── metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, icon: Icon, color, bg, onClick, active,
}: {
  label: string; value: number; icon: React.ElementType
  color: string; bg: string; onClick?: () => void; active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border text-left w-full transition-all',
        active ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card hover:shadow-md hover:border-primary/30',
      )}
    >
      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </button>
  )
}

// ─── section list ─────────────────────────────────────────────────────────────

type Section =
  | { type: 'preset'; id: 'all' | 'today' | 'week' | 'overdue' | 'done' }
  | { type: 'project'; id: string; title: string }

// ─── main component ───────────────────────────────────────────────────────────

interface TaskDashboardProps {
  tasks: TaskWithProject[]
  currentUserId?: string
}

export function TaskDashboard({ tasks: initialTasks, currentUserId }: TaskDashboardProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeSection, setActiveSection] = useState<string>('all')

  const myTasks = useMemo(
    () => currentUserId ? tasks.filter(t => t.assignee_id === currentUserId) : [],
    [tasks, currentUserId]
  )

  const scopedTasks = useMemo(
    () => activeSection === 'mine' ? myTasks : tasks,
    [tasks, myTasks, activeSection]
  )

  function handleToggle(taskId: string, newStatus: 'done' | 'backlog') {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  // ── metrics ────────────────────────────────────────────────────────────────
  const open   = useMemo(() => scopedTasks.filter((t) => t.status !== 'done'), [scopedTasks])
  const done   = useMemo(() => scopedTasks.filter((t) => t.status === 'done'), [scopedTasks])
  const today  = useMemo(() => open.filter((t) => t.due_date && isToday(parseISO(t.due_date))), [open])
  const week   = useMemo(() => open.filter((t) => t.due_date && isThisWeek(parseISO(t.due_date), { weekStartsOn: 0 })), [open])
  const overdue = useMemo(() => open.filter((t) => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date))), [open])

  const metrics = [
    { id: 'today',   label: 'Due Today',   value: today.length,   icon: Calendar,     color: 'text-amber-500',  bg: 'bg-amber-50' },
    { id: 'week',    label: 'This Week',   value: week.length,    icon: CalendarDays, color: 'text-blue-500',   bg: 'bg-blue-50' },
    { id: 'overdue', label: 'Overdue',     value: overdue.length, icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-50' },
    { id: 'done',    label: 'Completed',   value: done.length,    icon: TrendingUp,   color: 'text-emerald-500',bg: 'bg-emerald-50' },
  ]

  // ── sidebar sections ───────────────────────────────────────────────────────
  const projects = useMemo(() => {
    const map = new Map<string, string>()
    scopedTasks.forEach((t) => {
      if (t.project) map.set(t.project.id, t.project.title)
    })
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [tasks])

  const presets: { id: string; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all',     label: 'All Tasks', icon: ListTodo,    count: open.length },
    ...(currentUserId ? [{ id: 'mine', label: 'My Tasks', icon: CheckSquare, count: myTasks.filter(t => t.status !== 'done').length }] : []),
    { id: 'today',   label: 'Today',     icon: Calendar,    count: today.length },
    { id: 'week',    label: 'This Week', icon: CalendarDays,count: week.length },
    { id: 'overdue', label: 'Overdue',   icon: AlertCircle, count: overdue.length },
    { id: 'done',    label: 'Completed', icon: CheckSquare, count: done.length },
  ]

  // ── filtered tasks for main view ───────────────────────────────────────────
  const visibleTasks = useMemo(() => {
    if (activeSection === 'all' || activeSection === 'mine') return open
    if (activeSection === 'today')   return today
    if (activeSection === 'week')    return week
    if (activeSection === 'overdue') return overdue
    if (activeSection === 'done')    return done
    // project id
    return scopedTasks.filter((t) => t.project?.id === activeSection)
  }, [activeSection, scopedTasks, open, today, week, overdue, done])

  const activeIsProject = projects.some((p) => p.id === activeSection)
  const showProject = !activeIsProject

  const sectionLabel =
    presets.find((p) => p.id === activeSection)?.label ??
    projects.find((p) => p.id === activeSection)?.title ??
    'Tasks'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── page header ── */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {open.length} open · {done.length} completed
        </p>
      </div>

      {/* ── metric row ── */}
      <div className="px-8 pb-6 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <MetricCard
              key={m.id}
              label={m.label}
              value={m.value}
              icon={m.icon}
              color={m.color}
              bg={m.bg}
              active={activeSection === m.id}
              onClick={() => setActiveSection(m.id)}
            />
          ))}
        </div>
      </div>

      {/* ── two-column body ── */}
      <div className="flex flex-1 overflow-hidden px-8 pb-8 gap-5">

        {/* left panel */}
        <aside className="w-48 shrink-0 flex flex-col gap-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">
            Views
          </p>
          {presets.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
                activeSection === id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
              {count > 0 && (
                <span className={cn(
                  'text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                  activeSection === id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}

          {projects.length > 0 && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mt-4 mb-1">
                By Project
              </p>
              {projects.map(({ id, title }) => {
                const count = tasks.filter((t) => t.project?.id === id && t.status !== 'done').length
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
                      activeSection === id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="h-4 w-4 shrink-0" />
                      <span className="truncate">{title}</span>
                    </span>
                    {count > 0 && (
                      <span className={cn(
                        'text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center shrink-0',
                        activeSection === id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </aside>

        {/* main content */}
        <div className="flex-1 overflow-y-auto border rounded-xl bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
            <h2 className="text-sm font-semibold">{sectionLabel}</h2>
            <span className="text-xs text-muted-foreground">{visibleTasks.length} tasks</span>
          </div>

          {visibleTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CheckSquare className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs mt-1">No tasks in this view.</p>
            </div>
          ) : (
            <div className="divide-y">
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  showProject={showProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
