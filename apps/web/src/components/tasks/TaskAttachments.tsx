'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Upload, Trash2, Loader2, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { uploadTaskAttachmentAction, deleteTaskAttachmentAction } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'

export interface AttachmentRow {
  id: string
  filename: string
  size_bytes: number
  mime_type: string | null
  created_at: string
  url: string | null
  uploader_name: string
  can_delete: boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function iconFor(mime: string | null) {
  if (!mime) return FileIcon
  if (mime.startsWith('image/')) return ImageIcon
  if (mime.startsWith('text/') || mime === 'application/pdf') return FileText
  return FileIcon
}

interface Props {
  taskId: string
  attachments: AttachmentRow[]
}

export function TaskAttachments({ taskId, attachments }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      const res = await uploadTaskAttachmentAction(taskId, fd)
      if (res?.error) setError(res.error)
      else router.refresh()
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  function handleDelete(attId: string) {
    startTransition(async () => {
      const res = await deleteTaskAttachmentAction(attId, taskId)
      if (res?.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments
          {attachments.length > 0 && <span className="text-muted-foreground font-normal">({attachments.length})</span>}
        </h3>
        <label className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border cursor-pointer hover:bg-muted',
          isPending && 'opacity-60 pointer-events-none',
        )}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {isPending ? 'Uploading…' : 'Upload'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      {attachments.length > 0 ? (
        <div className="border rounded-lg divide-y">
          {attachments.map((a) => {
            const Icon = iconFor(a.mime_type)
            return (
              <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 group hover:bg-muted/40">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium truncate hover:underline block"
                    >
                      {a.filename}
                    </a>
                  ) : (
                    <span className="text-sm font-medium truncate block">{a.filename}</span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatSize(a.size_bytes)} · {a.uploader_name}
                  </p>
                </div>
                {a.can_delete && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    aria-label="Delete attachment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      )}
    </div>
  )
}
