'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, Plus, Pencil, Trash2, Star, Loader2 } from 'lucide-react'
import { ContactDialog } from './ContactDialog'
import { deleteContactAction, setPrimaryContactAction } from '@/app/actions/contacts'
import type { Contact } from '@invoke/types'

interface ContactListProps {
  clientId: string
  contacts: Contact[]
}

export function ContactList({ clientId, contacts }: ContactListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | undefined>(undefined)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openAdd() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(contact: Contact) {
    setEditing(contact)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    setPendingId(id)
    startTransition(async () => {
      await deleteContactAction(id, clientId)
      setPendingId(null)
    })
  }

  function handleSetPrimary(id: string) {
    setPendingId(id)
    startTransition(async () => {
      await setPrimaryContactAction(id, clientId)
      setPendingId(null)
    })
  }

  // Sort: primary first, then alphabetical
  const sorted = [...contacts].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.full_name.localeCompare(b.full_name)
  })

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Contacts ({contacts.length})</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add contact
        </Button>
      </div>

      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((contact) => {
            const busy = pendingId === contact.id
            return (
              <div
                key={contact.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-violet-100 text-violet-600 font-medium flex items-center justify-center shrink-0">
                  {contact.full_name[0]?.toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{contact.full_name}</span>
                    {contact.is_primary && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                        Primary
                      </Badge>
                    )}
                    {contact.title && (
                      <span className="text-xs text-muted-foreground">{contact.title}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 hover:text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 hover:text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!contact.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(contact.id)}
                      disabled={busy}
                      title="Set as primary"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(contact)}
                    disabled={busy}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                    disabled={busy}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p className="text-sm mb-3">No contacts yet.</p>
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add first contact
          </Button>
        </div>
      )}

      <ContactDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        clientId={clientId}
        contact={editing}
      />
    </>
  )
}
