'use client'

import { useState, useTransition } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, X, Loader2, Crown } from 'lucide-react'
import { addMemberAction, removeMemberAction } from '@/app/actions/members'
import type { User, ProjectMember } from '@invoke/types'

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

interface MembersPanelProps {
  projectId: string
  members: (ProjectMember & { user: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'> })[]
  allUsers: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>[]
  currentUserId: string
}

export function MembersPanel({ projectId, members, allUsers, currentUserId }: MembersPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  const memberIds = new Set(members.map((m) => m.user_id))
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id))

  const currentMember = members.find((m) => m.user_id === currentUserId)
  const isOwner = currentMember?.role === 'owner'

  function handleAdd(userId: string) {
    setLoadingUserId(userId)
    startTransition(async () => {
      await addMemberAction(projectId, userId)
      setLoadingUserId(null)
      setShowAdd(false)
    })
  }

  function handleRemove(userId: string) {
    setLoadingUserId(userId)
    startTransition(async () => {
      await removeMemberAction(projectId, userId)
      setLoadingUserId(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Team ({members.length})</h2>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setShowAdd((v) => !v)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add member
          </Button>
        )}
      </div>

      {/* Add member dropdown */}
      {showAdd && nonMembers.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Select a team member to add:</p>
          {nonMembers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(user.full_name || user.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAdd(user.id)}
                disabled={isPending && loadingUserId === user.id}
              >
                {isPending && loadingUserId === user.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : 'Add'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {showAdd && nonMembers.length === 0 && (
        <p className="text-sm text-muted-foreground px-1">All team members are already on this project.</p>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={member.user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(member.user?.full_name || member.user?.email || '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{member.user?.full_name || member.user?.email}</p>
                {member.role === 'owner' && (
                  <Crown className="h-3 w-3 text-amber-500 shrink-0" aria-label="Owner" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
            </div>
            {isOwner && member.user_id !== currentUserId && member.role !== 'owner' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(member.user_id)}
                disabled={isPending && loadingUserId === member.user_id}
              >
                {isPending && loadingUserId === member.user_id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <X className="h-3.5 w-3.5" />}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
