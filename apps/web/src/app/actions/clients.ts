'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== 'string') return []
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function readClientFields(formData: FormData) {
  const get = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }
  return {
    name: (formData.get('name') as string).trim(),
    description: get('description'),
    website: get('website'),
    phone: get('phone'),
    address: get('address'),
    industry: get('industry'),
    company_size: get('company_size'),
    notes: get('notes'),
    tags: parseTags(formData.get('tags')),
  }
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()

  const fields = readClientFields(formData)

  const { data, error } = await supabase
    .from('clients')
    .insert(fields)
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/clients')
  redirect(`/clients/${data.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient()

  const fields = readClientFields(formData)

  const { error } = await supabase.from('clients').update(fields).eq('id', id)

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
