'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActivityType } from '@invoke/types'

const ACTIVITY_TYPES: readonly ActivityType[] = ['note', 'call', 'email', 'meeting', 'task']

interface ActivityTarget {
  clientId?: string | null
  contactId?: string | null
  projectId?: string | null
}

function readActivityFields(formData: FormData) {
  const type = formData.get('type') as ActivityType
  if (!ACTIVITY_TYPES.includes(type)) {
    throw new Error('Invalid activity type')
  }
  const subject = (formData.get('subject') as string)?.trim()
  if (!subject) throw new Error('Subject is required')

  const bodyRaw = formData.get('body')
  const body = typeof bodyRaw === 'string' && bodyRaw.trim().length > 0 ? bodyRaw.trim() : null

  const occurredRaw = formData.get('occurred_at')
  const occurred_at =
    typeof occurredRaw === 'string' && occurredRaw.length > 0
      ? new Date(occurredRaw).toISOString()
      : new Date().toISOString()

  return { type, subject, body, occurred_at }
}

function pathsToRevalidate(target: ActivityTarget) {
  const paths: string[] = []
  if (target.clientId) paths.push(`/clients/${target.clientId}`)
  if (target.projectId) paths.push(`/projects/${target.projectId}`)
  return paths
}

export async function createActivityAction(target: ActivityTarget, formData: FormData) {
  if (!target.clientId && !target.contactId && !target.projectId) {
    return { error: 'Activity must target a client, contact, or project' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  let fields
  try {
    fields = readActivityFields(formData)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid input' }
  }

  const { error } = await supabase.from('activities').insert({
    ...fields,
    client_id: target.clientId ?? null,
    contact_id: target.contactId ?? null,
    project_id: target.projectId ?? null,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  for (const p of pathsToRevalidate(target)) revalidatePath(p)
}

export async function deleteActivityAction(
  activityId: string,
  target: ActivityTarget
) {
  const supabase = await createClient()
  const { error } = await supabase.from('activities').delete().eq('id', activityId)

  if (error) return { error: error.message }

  for (const p of pathsToRevalidate(target)) revalidatePath(p)
}
