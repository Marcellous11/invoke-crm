'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const contact_name = formData.get('contact_name') as string
  const contact_email = formData.get('contact_email') as string

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      description: description || null,
      contact_name: contact_name || null,
      contact_email: contact_email || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect(`/clients/${data.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const contact_name = formData.get('contact_name') as string
  const contact_email = formData.get('contact_email') as string

  const { error } = await supabase
    .from('clients')
    .update({
      name,
      description: description || null,
      contact_name: contact_name || null,
      contact_email: contact_email || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect('/clients')
}
