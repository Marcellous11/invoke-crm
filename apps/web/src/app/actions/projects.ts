'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const client_id = formData.get('client_id') as string
  const status = formData.get('status') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description: description || null,
      client_id: client_id || null,
      status: status || 'active',
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/projects')
  redirect(`/projects/${data.id}`)
}

export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const client_id = formData.get('client_id') as string
  const status = formData.get('status') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  const { error } = await supabase
    .from('projects')
    .update({
      title,
      description: description || null,
      client_id: client_id || null,
      status: status || 'active',
      start_date: start_date || null,
      end_date: end_date || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  redirect(`/projects/${id}`)
}

export async function updateProjectDescriptionAction(id: string, description: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update({ description: description || null })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${id}`)
}

export async function deleteProjectAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/projects')
  redirect('/projects')
}
