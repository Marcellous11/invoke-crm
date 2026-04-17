'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TaskStatus, TaskPriority } from '@invoke/types'

export async function createTaskAction(data: {
  projectId: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id?: string
  due_date?: string
  start_date?: string
}) {
  const supabase = await createClient()

  // Get max position in the column
  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('project_id', data.projectId)
    .eq('status', data.status)
    .order('position', { ascending: false })
    .limit(1)

  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: data.projectId,
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assignee_id: data.assignee_id || null,
      due_date: data.due_date || null,
      start_date: data.start_date || null,
      position,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projects/${data.projectId}/board`)
  revalidatePath(`/projects/${data.projectId}/calendar`)
  return { task }
}

export async function updateTaskAction(
  taskId: string,
  projectId: string,
  updates: {
    title?: string
    description?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    assignee_id?: string | null
    due_date?: string | null
    start_date?: string | null
    position?: number
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}/board`)
  revalidatePath(`/projects/${projectId}/calendar`)
}

export async function updateTaskStatusAction(
  taskId: string,
  projectId: string,
  status: TaskStatus,
  position: number
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status, position })
    .eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}/board`)
}

export async function reorderTasksAction(
  projectId: string,
  updates: { id: string; position: number; status: TaskStatus }[]
) {
  const supabase = await createClient()
  await Promise.all(
    updates.map(({ id, position, status }) =>
      supabase.from('tasks').update({ position, status }).eq('id', id)
    )
  )
  revalidatePath(`/projects/${projectId}/board`)
}

export async function deleteTaskAction(taskId: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) return { error: error.message }
  revalidatePath(`/projects/${projectId}/board`)
  revalidatePath(`/projects/${projectId}/calendar`)
}
