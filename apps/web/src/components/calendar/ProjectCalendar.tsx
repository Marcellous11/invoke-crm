'use client'

import { useState, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale/en-US'
import { TaskModal } from '@/components/board/TaskModal'
import type { Task, User } from '@invoke/types'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
})

const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Task
}

interface ProjectCalendarProps {
  tasks: Task[]
  projectId: string
  members: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]
}

export function ProjectCalendar({ tasks, projectId, members }: ProjectCalendarProps) {
  const [localTasks, setLocalTasks] = useState(tasks)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)
  const [modalOpen, setModalOpen] = useState(false)

  const events: CalendarEvent[] = useMemo(() =>
    localTasks
      .filter((t) => t.due_date)
      .map((t) => {
        const date = new Date(t.due_date! + 'T00:00:00')
        return {
          id: t.id,
          title: t.title,
          start: date,
          end: date,
          resource: t,
        }
      }),
    [localTasks]
  )

  function eventStyleGetter(event: CalendarEvent) {
    const color = PRIORITY_COLORS[event.resource.priority] ?? '#6366f1'
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        border: 'none',
        color: '#fff',
        fontSize: '12px',
        padding: '2px 6px',
      },
    }
  }

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedTask(event.resource)
    setModalOpen(true)
  }

  function handleSave(saved: Task) {
    setLocalTasks((prev) => {
      const exists = prev.find((t) => t.id === saved.id)
      return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
    })
  }

  function handleDelete(taskId: string) {
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <>
      <div className="h-full min-h-[600px] [&_.rbc-calendar]:h-full [&_.rbc-toolbar]:mb-4 [&_.rbc-toolbar-label]:font-semibold [&_.rbc-today]:bg-primary/5 [&_.rbc-off-range-bg]:bg-muted/30 [&_.rbc-event]:cursor-pointer">
        <Calendar
          localizer={localizer}
          events={events}
          defaultView={Views.MONTH}
          views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          popup
        />
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedTask(undefined) }}
        projectId={projectId}
        task={selectedTask}
        members={members}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  )
}
