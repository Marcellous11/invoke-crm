'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FolderKanban, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Project = {
  id: string
  title: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  clients: { name: string } | { name: string }[] | null
}

const statusOptions = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'on_hold',   label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

const statusMap: Record<string, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  on_hold:   { label: 'On Hold',   className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
}

export function ProjectsFilter({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(
    () => filter === 'all' ? projects : projects.filter(p => p.status === filter),
    [projects, filter]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length }
    for (const p of projects) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [projects])

  return (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6">
        {statusOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
              filter === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            )}
          >
            {label}
            {counts[value] != null && (
              <span className={cn('ml-1.5 text-xs', filter === value ? 'opacity-75' : 'opacity-50')}>
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const status = statusMap[project.status] ?? { label: project.status, className: 'bg-muted text-muted-foreground' }
            const clientName = project.clients && !Array.isArray(project.clients)
              ? (project.clients as { name: string }).name
              : null
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{project.title}</p>
                      {clientName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
                      )}
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    {(project.start_date || project.end_date) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {project.start_date
                            ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                          {' → '}
                          {project.end_date
                            ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Ongoing'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter !== 'all' ? statusMap[filter]?.label.toLowerCase() : ''} projects.</p>
        </div>
      )}
    </>
  )
}
