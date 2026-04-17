'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, User } from '@invoke/types'

const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
}

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: (Task & { assignee?: Pick<User, 'id' | 'full_name' | 'avatar_url'> })[]
  onAddTask: () => void
  onEditTask: (task: Task) => void
}

export function KanbanColumn({ id, title, tasks, onAddTask, onEditTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', COLUMN_COLORS[id])} />
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2 p-2 rounded-xl min-h-[200px] transition-colors',
          isOver ? 'bg-primary/5 border-2 border-dashed border-primary/30' : 'bg-muted/40'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onEditTask(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={onAddTask}
            className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground/50 hover:text-muted-foreground py-6 w-full rounded-lg border-2 border-dashed border-transparent hover:border-muted-foreground/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
