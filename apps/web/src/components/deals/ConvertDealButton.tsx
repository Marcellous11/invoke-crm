'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FolderPlus, Loader2 } from 'lucide-react'
import { convertDealToProjectAction } from '@/app/actions/deals'

export function ConvertDealButton({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    setLoading(true)
    setError(null)
    const result = await convertDealToProjectAction(dealId)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleConvert} disabled={loading}>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
        )}
        Convert to project
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
