import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="flex gap-4 flex-1 overflow-hidden">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3 w-72 shrink-0">
            <Skeleton className="h-8 rounded-lg" />
            {Array.from({ length: 3 + col }).map((_, card) => (
              <Skeleton key={card} className="h-24 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
