'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import type { Client } from '@invoke/types'

interface ClientFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  defaultValues?: Partial<Client>
  submitLabel?: string
}

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+']

export function ClientForm({ action, defaultValues, submitLabel = 'Save' }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => {
      return await action(formData)
    },
    undefined
  )

  const defaultTags = defaultValues?.tags?.join(', ') ?? ''

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
          <Label htmlFor="name">Client name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            name="name"
            placeholder="Acme Corp"
            defaultValue={defaultValues?.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What does this client do?"
            defaultValue={defaultValues?.description ?? ''}
            rows={3}
          />
        </div>
      </section>

      {/* ─── Company info ─── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://acme.com"
              defaultValue={defaultValues?.website ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 555 123 4567"
              defaultValue={defaultValues?.phone ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="Fintech"
              defaultValue={defaultValues?.industry ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_size">Company size</Label>
            <select
              id="company_size"
              name="company_size"
              defaultValue={defaultValues?.company_size ?? ''}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">—</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} employees
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="123 Main St, San Francisco, CA 94105"
            defaultValue={defaultValues?.address ?? ''}
          />
        </div>
      </section>

      {/* ─── Tags + notes ─── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Other</h3>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="retainer, priority, enterprise"
            defaultValue={defaultTags}
          />
          <p className="text-xs text-muted-foreground">Comma-separated</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Internal notes about this client"
            defaultValue={defaultValues?.notes ?? ''}
            rows={4}
          />
        </div>
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
