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

export function ClientForm({ action, defaultValues, submitLabel = 'Save' }: ClientFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => {
      return await action(formData)
    },
    undefined
  )

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input
            id="contact_name"
            name="contact_name"
            placeholder="Jane Smith"
            defaultValue={defaultValues?.contact_name ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="jane@acme.com"
            defaultValue={defaultValues?.contact_email ?? ''}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
