'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { reorderTasksAction } from '@/app/actions/tasks'
import { KANBAN_COLUMNS } from '@invoke/types'
import type { Task, TaskStatus, User } from '@invoke/types'

type EnrichedTask = Task & { assignee?: Pick<User, 'id' | 'full_name' | 'avatar_url'> }

interface KanbanBoardProps {
  initialTasks: EnrichedTask[]
  projectId: string
  members: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]
}

export function KanbanBoard({ initialTasks, projectId, members }: KanbanBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<EnrichedTask[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<EnrichedTask | null>(null)

  // Modal state (only used for creating new tasks — edits open the task detail page)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDefaultStatus, setModalDefaultStatus] = useState<TaskStatus>('backlog')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  // Group tasks by column, sorted by position
  const tasksByColumn = useCallback(() => {
    const map = {} as Record<TaskStatus, EnrichedTask[]>
    for (const col of KANBAN_COLUMNS) {
      map[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.position - b.position)
    }
    return map
  }, [tasks])()

  function findTaskColumn(taskId: string): TaskStatus | null {
    return tasks.find((t) => t.id === taskId)?.status ?? null
  }

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumn = findTaskColumn(activeId)
    // over.id can be a column id or a task id
    const overColumn = (KANBAN_COLUMNS.some(c => c.id === overId)
      ? overId
      : findTaskColumn(overId)) as TaskStatus | null

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    // Move task to new column (optimistic)
    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, status: overColumn } : t))
    )
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const overIsColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
    const targetColumn = overIsColumn ? (overId as TaskStatus) : findTaskColumn(overId)
    if (!targetColumn) return

    const columnTasks = tasks
      .filter((t) => t.status === targetColumn)
      .sort((a, b) => a.position - b.position)

    if (activeTask.status === targetColumn && !overIsColumn) {
      // Reorder within same column
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
      const newIndex = columnTasks.findIndex((t) => t.id === overId)
      if (oldIndex === newIndex) return

      const reordered = arrayMove(columnTasks, oldIndex, newIndex)
      const updates = reordered.map((t, i) => ({ id: t.id, position: i, status: targetColumn }))

      setTasks((prev) =>
        prev.map((t) => {
          const u = updates.find((u) => u.id === t.id)
          return u ? { ...t, position: u.position } : t
        })
      )
      reorderTasksAction(projectId, updates)
    } else {
      // Cross-column drop — finalize position at end of column
      const position = columnTasks.filter((t) => t.id !== activeId).length
      const updates = [{ id: activeId, position, status: targetColumn }]
      setTasks((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, status: targetColumn, position } : t))
      )
      reorderTasksAction(projectId, updates)
    }
  }

  function openNewTask(status: TaskStatus) {
    setModalDefaultStatus(status)
    setModalOpen(true)
  }

  function openEditTask(task: Task) {
    router.push(`/tasks/${task.id}`)
  }

  function handleSave(saved: Task) {
    setTasks((prev) => [...prev, saved as EnrichedTask])
  }

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasksByColumn[col.id]}
              onAddTask={() => openNewTask(col.id)}
              onEditTask={openEditTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <TaskCard task={activeTask} onClick={() => {}} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        defaultStatus={modalDefaultStatus}
        members={members}
        onSave={handleSave}
      />
    </>
  )
}
