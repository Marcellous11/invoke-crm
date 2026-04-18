'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TaskModal } from '@/components/board/TaskModal'
import { Pencil } from 'lucide-react'
import type { Task, User } from '@invoke/types'

interface EditTaskButtonProps {
  task: Task
  members: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]
}

export function EditTaskButton({ task, members }: EditTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        Edit
      </Button>
      <TaskModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={task.project_id}
        task={task}
        members={members}
        onSave={() => {
          setOpen(false)
          router.refresh()
        }}
        onDelete={() => {
          router.push(`/projects/${task.project_id}/board`)
        }}
      />
    </>
  )
}
