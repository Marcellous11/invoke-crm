'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import type { Deal, DealStage } from '@invoke/types'

type ClientOption = { id: string; name: string }
type ContactOption = { id: string; full_name: string; client_id: string; is_primary: boolean }
type UserOption = { id: string; full_name: string }

interface DealFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  defaultValues?: Partial<Deal>
  clients: ClientOption[]
  contacts: ContactOption[]
  users: UserOption[]
  submitLabel?: string
}

const STAGES: { id: DealStage; label: string }[] = [
  { id: 'lead',        label: 'Lead' },
  { id: 'qualified',   label: 'Qualified' },
  { id: 'proposal',    label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won',         label: 'Won' },
  { id: 'lost',        label: 'Lost' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function DealForm({
  action,
  defaultValues,
  clients,
  contacts,
  users,
  submitLabel = 'Save',
}: DealFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => {
      return await action(formData)
    },
    undefined
  )

  const [clientId, setClientId] = useState<string>(defaultValues?.client_id ?? '')
  const [stage, setStage] = useState<DealStage>(defaultValues?.stage ?? 'lead')

  const clientContacts = contacts.filter((c) => c.client_id === clientId)
  const valueDefault =
    defaultValues?.value_cents != null ? (defaultValues.value_cents / 100).toString() : ''

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* ─── Basics ─── */}
      <section className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Deal title <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            name="title"
            placeholder="Acme Q2 expansion"
            defaultValue={defaultValues?.title}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What's this deal about?"
            defaultValue={defaultValues?.description ?? ''}
            rows={3}
          />
        </div>
      </section>

      {/* ─── Client + contact ─── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Who</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client <span className="text-destructive">*</span></Label>
            <select
              id="client_id"
              name="client_id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className={SELECT_CLASS}
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_contact_id">Primary contact</Label>
            <select
              id="primary_contact_id"
              name="primary_contact_id"
              defaultValue={defaultValues?.primary_contact_id ?? ''}
              disabled={!clientId}
              className={SELECT_CLASS}
              key={clientId}
            >
              <option value="">—</option>
              {clientContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}{c.is_primary ? ' (primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_id">Owner</Label>
            <select
              id="owner_id"
              name="owner_id"
              defaultValue={defaultValues?.owner_id ?? ''}
              className={SELECT_CLASS}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ─── Pipeline ─── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              name="stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className={SELECT_CLASS}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="probability">Probability (%)</Label>
            <Input
              id="probability"
              name="probability"
              type="number"
              min={0}
              max={100}
              placeholder="50"
              defaultValue={defaultValues?.probability ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              min={0}
              placeholder="25000"
              defaultValue={valueDefault}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue={defaultValues?.currency ?? 'USD'}
              className={SELECT_CLASS}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="expected_close_date">Expected close date</Label>
            <Input
              id="expected_close_date"
              name="expected_close_date"
              type="date"
              defaultValue={defaultValues?.expected_close_date ?? ''}
            />
          </div>
        </div>

        {stage === 'lost' && (
          <div className="space-y-2">
            <Label htmlFor="lost_reason">Lost reason</Label>
            <Textarea
              id="lost_reason"
              name="lost_reason"
              rows={2}
              placeholder="Why did this deal fall through?"
              defaultValue={defaultValues?.lost_reason ?? ''}
            />
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
