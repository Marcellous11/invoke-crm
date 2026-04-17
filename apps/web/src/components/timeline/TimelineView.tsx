'use client'

import { useState } from 'react'
import { addMonths, addWeeks, addQuarters, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format, eachMonthOfInterval, eachWeekOfInterval, isWithinInterval, isBefore, isAfter } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Project } from '@invoke/types'

type Zoom = 'month' | 'quarter' | 'halfyear'

const ZOOM_OPTIONS: { value: Zoom; label: string }[] = [
  { value: 'month', label: '1 Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'halfyear', label: '6 Months' },
]

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  active: { bar: 'bg-blue-500', text: 'text-blue-700' },
  completed: { bar: 'bg-emerald-500', text: 'text-emerald-700' },
  on_hold: { bar: 'bg-amber-500', text: 'text-amber-700' },
}

interface TimelineProject extends Pick<Project, 'id' | 'title' | 'status' | 'start_date' | 'end_date'> {
  client?: { name: string } | null
}

interface TimelineViewProps {
  projects: TimelineProject[]
}

export function TimelineView({ projects }: TimelineViewProps) {
  const [zoom, setZoom] = useState<Zoom>('quarter')
  const [anchor, setAnchor] = useState(() => new Date())

  const today = new Date()

  // Compute visible range
  const { rangeStart, rangeEnd } = (() => {
    if (zoom === 'month') return { rangeStart: startOfWeek(anchor), rangeEnd: endOfWeek(addMonths(anchor, 1)) }
    if (zoom === 'quarter') return { rangeStart: startOfMonth(anchor), rangeEnd: endOfMonth(addMonths(anchor, 2)) }
    return { rangeStart: startOfMonth(anchor), rangeEnd: endOfMonth(addMonths(anchor, 5)) }
  })()

  const totalDays = differenceInDays(rangeEnd, rangeStart) + 1

  // Build column headers
  const months = eachMonthOfInterval({ start: rangeStart, end: rangeEnd })

  function dayOffset(date: Date) {
    return Math.max(0, differenceInDays(date, rangeStart))
  }

  function prev() {
    if (zoom === 'month') setAnchor((d) => addWeeks(d, -4))
    else if (zoom === 'quarter') setAnchor((d) => addMonths(d, -3))
    else setAnchor((d) => addMonths(d, -6))
  }
  function next() {
    if (zoom === 'month') setAnchor((d) => addWeeks(d, 4))
    else if (zoom === 'quarter') setAnchor((d) => addMonths(d, 3))
    else setAnchor((d) => addMonths(d, 6))
  }

  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date)
  const projectsNoDates = projects.filter((p) => !p.start_date || !p.end_date)

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="h-8 w-8 rounded-md border flex items-center justify-center text-sm hover:bg-muted transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="h-8 px-3 rounded-md border text-sm hover:bg-muted transition-colors"
          >
            Today
          </button>
          <button
            onClick={next}
            className="h-8 w-8 rounded-md border flex items-center justify-center text-sm hover:bg-muted transition-colors"
          >
            ›
          </button>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {ZOOM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setZoom(opt.value)}
              className={cn(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                zoom === opt.value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 700 }}>
            {/* Month header row */}
            <div className="flex border-b bg-muted/40">
              {/* Row label column */}
              <div className="w-52 shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground border-r">
                Project
              </div>
              {/* Month segments */}
              <div className="flex flex-1">
                {months.map((month) => {
                  const mStart = startOfMonth(month)
                  const mEnd = endOfMonth(month)
                  const visStart = isBefore(mStart, rangeStart) ? rangeStart : mStart
                  const visEnd = isAfter(mEnd, rangeEnd) ? rangeEnd : mEnd
                  const width = ((differenceInDays(visEnd, visStart) + 1) / totalDays) * 100
                  return (
                    <div
                      key={month.toISOString()}
                      style={{ width: `${width}%` }}
                      className="px-2 py-2 text-xs font-semibold text-muted-foreground border-r last:border-r-0"
                    >
                      {format(month, 'MMM yyyy')}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Project rows */}
            {projectsWithDates.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                No projects with start and end dates.{' '}
                <Link href="/projects" className="text-primary hover:underline ml-1">Add dates to projects</Link>
              </div>
            )}

            {projectsWithDates.map((project) => {
              const start = new Date(project.start_date! + 'T00:00:00')
              const end = new Date(project.end_date! + 'T00:00:00')

              // Clamp to visible range
              const barStart = isBefore(start, rangeStart) ? rangeStart : start
              const barEnd = isAfter(end, rangeEnd) ? rangeEnd : end
              const visible = !isAfter(barStart, rangeEnd) && !isBefore(barEnd, rangeStart)

              const leftPct = (dayOffset(barStart) / totalDays) * 100
              const widthPct = Math.max(
                0.5,
                ((differenceInDays(barEnd, barStart) + 1) / totalDays) * 100
              )

              const colors = STATUS_COLORS[project.status] ?? STATUS_COLORS.active
              const isOverdue =
                project.status !== 'completed' && isBefore(end, today)

              return (
                <div key={project.id} className="flex border-b last:border-b-0 hover:bg-muted/20 group">
                  {/* Label */}
                  <div className="w-52 shrink-0 px-4 py-3 border-r">
                    <Link href={`/projects/${project.id}`} className="group-hover:text-primary transition-colors">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      {project.client && (
                        <p className="text-xs text-muted-foreground truncate">{project.client.name}</p>
                      )}
                    </Link>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative py-3 px-0" style={{ height: 56 }}>
                    {/* Today line */}
                    {isWithinInterval(today, { start: rangeStart, end: rangeEnd }) && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10"
                        style={{ left: `${(dayOffset(today) / totalDays) * 100}%` }}
                      />
                    )}

                    {visible && (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-7 rounded-md flex items-center px-2 overflow-hidden',
                          isOverdue ? 'bg-red-500' : colors.bar
                        )}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${format(start, 'MMM d')} → ${format(end, 'MMM d, yyyy')}`}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {format(start, 'MMM d')} → {format(end, 'MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Projects without dates */}
            {projectsNoDates.length > 0 && (
              <>
                <div className="flex border-t border-b bg-muted/20">
                  <div className="w-52 shrink-0 px-4 py-1.5 border-r">
                    <span className="text-xs text-muted-foreground font-medium">No dates set</span>
                  </div>
                  <div className="flex-1" />
                </div>
                {projectsNoDates.map((project) => (
                  <div key={project.id} className="flex border-b last:border-b-0 hover:bg-muted/20">
                    <div className="w-52 shrink-0 px-4 py-3 border-r">
                      <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                        {project.client && (
                          <p className="text-xs text-muted-foreground truncate">{project.client.name}</p>
                        )}
                      </Link>
                    </div>
                    <div className="flex-1 flex items-center px-4">
                      <Link href={`/projects/${project.id}/edit`} className="text-xs text-muted-foreground hover:text-primary">
                        + Add dates
                      </Link>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
