'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { Client, Project } from '@invoke/types'

interface ProjectFormProps {
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  clients: Pick<Client, 'id' | 'name'>[]
  defaultValues?: Partial<Project>
  defaultClientId?: string
  submitLabel?: string
}

export function ProjectForm({
  action,
  clients,
  defaultValues,
  defaultClientId,
  submitLabel = 'Save',
}: ProjectFormProps) {
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
        <Label htmlFor="title">Project title <span className="text-destructive">*</span></Label>
        <Input
          id="title"
          name="title"
          placeholder="New website redesign"
          defaultValue={defaultValues?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What's this project about?"
          defaultValue={defaultValues?.description ?? ''}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client selector */}
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <select
            id="client_id"
            name="client_id"
            defaultValue={defaultValues?.client_id ?? defaultClientId ?? ''}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? 'active'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={defaultValues?.start_date ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={defaultValues?.end_date ?? ''}
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
