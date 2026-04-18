import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex-1 overflow-hidden p-6">
        <div className="flex gap-4 h-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
