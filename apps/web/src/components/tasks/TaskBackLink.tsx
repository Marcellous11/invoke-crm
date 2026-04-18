'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface TaskBackLinkProps {
  fallbackHref: string
  fallbackLabel: string
}

export function TaskBackLink({ fallbackHref, fallbackLabel }: TaskBackLinkProps) {
  const router = useRouter()

  function handleClick() {
    // If there's history to go back to, use it; otherwise fall back to the project board.
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to {fallbackLabel}
    </button>
  )
}
