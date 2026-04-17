'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addMemberAction(projectId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role: 'member' })

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
}

export async function removeMemberAction(projectId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
}
