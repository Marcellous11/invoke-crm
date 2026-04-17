'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, User } from '@invoke/types'

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface TaskCardProps {
  task: Task & { assignee?: Pick<User, 'id' | 'full_name' | 'avatar_url'> }
  onClick: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all select-none',
        (isDragging || isSortableDragging) && 'opacity-40 shadow-lg'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

          <div className="flex items-center justify-between mt-2 gap-2">
            <span className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded capitalize',
              PRIORITY_STYLES[task.priority] ?? 'bg-muted text-muted-foreground'
            )}>
              {task.priority}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.assignee && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(task.assignee.full_name || '?')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
