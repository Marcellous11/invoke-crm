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

// ─── Subtasks ────────────────────────────────────────────────────────────────

export async function createSubtaskAction(parentTaskId: string, title: string) {
  const trimmed = title.trim()
  if (!trimmed) return { error: 'Title is required' }

  const supabase = await createClient()

  const { data: parent, error: parentErr } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', parentTaskId)
    .single()
  if (parentErr || !parent) return { error: 'Parent task not found' }

  const { data: existing } = await supabase
    .from('tasks')
    .select('position')
    .eq('parent_task_id', parentTaskId)
    .order('position', { ascending: false })
    .limit(1)
  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { error } = await supabase.from('tasks').insert({
    project_id: parent.project_id,
    parent_task_id: parentTaskId,
    title: trimmed,
    status: 'backlog',
    priority: 'medium',
    position,
  })

  if (error) return { error: error.message }
  revalidatePath(`/tasks/${parentTaskId}`)
}

export async function toggleSubtaskDoneAction(subtaskId: string, parentTaskId: string) {
  const supabase = await createClient()
  const { data: current } = await supabase
    .from('tasks').select('status').eq('id', subtaskId).single()
  if (!current) return { error: 'Subtask not found' }
  const nextStatus = current.status === 'done' ? 'backlog' : 'done'
  const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', subtaskId)
  if (error) return { error: error.message }
  revalidatePath(`/tasks/${parentTaskId}`)
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function createTaskCommentAction(taskId: string, formData: FormData) {
  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Comment body is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    author_id: user.id,
    body,
  })

  if (error) return { error: error.message }
  revalidatePath(`/tasks/${taskId}`)
}

export async function updateTaskCommentAction(commentId: string, taskId: string, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comment body is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('task_comments')
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath(`/tasks/${taskId}`)
}

export async function deleteTaskCommentAction(commentId: string, taskId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath(`/tasks/${taskId}`)
}

// ─── Attachments ─────────────────────────────────────────────────────────────

export async function uploadTaskAttachmentAction(taskId: string, formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'No file provided' }
  }
  if (file.size > 25 * 1024 * 1024) {
    return { error: 'File too large (max 25MB)' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const path = `${taskId}/${crypto.randomUUID()}-${file.name}`

  const { error: uploadErr } = await supabase.storage
    .from('task-attachments')
    .upload(path, file, { contentType: file.type || 'application/octet-stream' })
  if (uploadErr) return { error: uploadErr.message }

  const { error: insertErr } = await supabase.from('task_attachments').insert({
    task_id: taskId,
    uploaded_by: user.id,
    storage_path: path,
    filename: file.name,
    size_bytes: file.size,
    mime_type: file.type || null,
  })
  if (insertErr) {
    await supabase.storage.from('task-attachments').remove([path])
    return { error: insertErr.message }
  }

  revalidatePath(`/tasks/${taskId}`)
}

export async function deleteTaskAttachmentAction(attachmentId: string, taskId: string) {
  const supabase = await createClient()

  const { data: att } = await supabase
    .from('task_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .single()
  if (!att) return { error: 'Attachment not found' }

  const { error: delErr } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)
  if (delErr) return { error: delErr.message }

  await supabase.storage.from('task-attachments').remove([att.storage_path])

  revalidatePath(`/tasks/${taskId}`)
}
