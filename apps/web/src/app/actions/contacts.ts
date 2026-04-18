'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function readContactFields(formData: FormData) {
  const get = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }
  return {
    full_name: (formData.get('full_name') as string).trim(),
    email: get('email'),
    phone: get('phone'),
    title: get('title'),
    notes: get('notes'),
    is_primary: formData.get('is_primary') === 'on',
  }
}

async function clearOtherPrimaries(clientId: string, exceptContactId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('contacts')
    .update({ is_primary: false })
    .eq('client_id', clientId)
    .eq('is_primary', true)
  if (exceptContactId) query = query.neq('id', exceptContactId)
  await query
}

export async function createContactAction(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const fields = readContactFields(formData)

  if (fields.is_primary) {
    await clearOtherPrimaries(clientId)
  }

  const { error } = await supabase
    .from('contacts')
    .insert({ ...fields, client_id: clientId })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}

export async function updateContactAction(
  contactId: string,
  clientId: string,
  formData: FormData
) {
  const supabase = await createClient()
  const fields = readContactFields(formData)

  if (fields.is_primary) {
    await clearOtherPrimaries(clientId, contactId)
  }

  const { error } = await supabase
    .from('contacts')
    .update(fields)
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}

export async function deleteContactAction(contactId: string, clientId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}

export async function setPrimaryContactAction(contactId: string, clientId: string) {
  const supabase = await createClient()

  await clearOtherPrimaries(clientId, contactId)
  const { error } = await supabase
    .from('contacts')
    .update({ is_primary: true })
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}
