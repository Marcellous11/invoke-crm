'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { DealStage } from '@invoke/types'

const STAGES: readonly DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

function readDealFields(formData: FormData) {
  const get = (key: string) => {
    const v = formData.get(key)
    return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
  }

  const stageRaw = formData.get('stage') as string | null
  const stage = STAGES.includes(stageRaw as DealStage) ? (stageRaw as DealStage) : 'lead'

  const valueStr = get('value')
  const value_cents = valueStr ? Math.round(parseFloat(valueStr) * 100) : null

  const probStr = get('probability')
  const probability = probStr ? Math.max(0, Math.min(100, parseInt(probStr, 10))) : null

  return {
    title: (formData.get('title') as string).trim(),
    description: get('description'),
    client_id: formData.get('client_id') as string,
    primary_contact_id: get('primary_contact_id'),
    stage,
    value_cents,
    currency: get('currency') ?? 'USD',
    probability,
    expected_close_date: get('expected_close_date'),
    owner_id: get('owner_id'),
    lost_reason: stage === 'lost' ? get('lost_reason') : null,
  }
}

export async function createDealAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fields = readDealFields(formData)
  if (!fields.client_id) return { error: 'Client is required' }

  // Put new deals at the end of their column
  const { count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .eq('stage', fields.stage)

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...fields, created_by: user.id, position: count ?? 0 })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/deals')
  revalidatePath(`/clients/${fields.client_id}`)
  redirect(`/deals/${data.id}`)
}

export async function updateDealAction(id: string, formData: FormData) {
  const supabase = await createClient()
  const fields = readDealFields(formData)

  const { error } = await supabase.from('deals').update(fields).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/deals')
  revalidatePath(`/deals/${id}`)
  if (fields.client_id) revalidatePath(`/clients/${fields.client_id}`)
  redirect(`/deals/${id}`)
}

export async function deleteDealAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/deals')
  redirect('/deals')
}

export async function reorderDealsAction(
  updates: { id: string; position: number; stage: DealStage }[]
) {
  const supabase = await createClient()
  await Promise.all(
    updates.map(({ id, position, stage }) =>
      supabase.from('deals').update({ position, stage }).eq('id', id)
    )
  )
  revalidatePath('/deals')
}

export async function convertDealToProjectAction(dealId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: deal, error: dealErr } = await supabase
    .from('deals')
    .select('id, title, description, client_id, expected_close_date, project_id')
    .eq('id', dealId)
    .single()

  if (dealErr || !deal) return { error: dealErr?.message ?? 'Deal not found' }
  if (deal.project_id) return { error: 'Deal already converted to a project' }

  const { data: project, error: projErr } = await supabase
    .from('projects')
    .insert({
      title: deal.title,
      description: deal.description,
      client_id: deal.client_id,
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: deal.expected_close_date,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (projErr) return { error: projErr.message }

  await supabase.from('deals').update({ project_id: project.id }).eq('id', dealId)

  revalidatePath(`/deals/${dealId}`)
  revalidatePath('/deals')
  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}
