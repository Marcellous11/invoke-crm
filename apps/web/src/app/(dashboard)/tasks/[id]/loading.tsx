export default function Loading() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-5 w-40 bg-muted rounded mb-6" />
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-muted rounded-full" />
        <div className="h-5 w-20 bg-muted rounded" />
      </div>
      <div className="h-8 w-2/3 bg-muted rounded mb-6" />
      <div className="h-24 bg-muted rounded-lg mb-6" />
      <div className="h-32 bg-muted rounded-lg mb-6" />
      <div className="h-40 bg-muted rounded-lg mb-6" />
      <div className="h-40 bg-muted rounded-lg" />
    </div>
  )
}
