'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { FolderKanban, Users, CheckSquare, LayoutDashboard, GanttChart, BarChart2, Settings, Search } from 'lucide-react'

type Project = { id: string; title: string; status: string }
type Client  = { id: string; name: string }
type Task    = { id: string; title: string; project_id: string; project?: { title: string } | null }

interface Props {
  projects: Project[]
  clients: Client[]
  tasks: Task[]
}

const statusColor: Record<string, string> = {
  active:    'bg-emerald-500',
  completed: 'bg-slate-400',
  on_hold:   'bg-amber-400',
}

export function CommandPalette({ projects, clients, tasks }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const go = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <Command className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Search projects, clients, tasks…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          <Command.List className="max-h-[380px] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider">
              {[
                { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/projects',  label: 'Projects',  icon: FolderKanban },
                { href: '/clients',   label: 'Clients',   icon: Users },
                { href: '/tasks',     label: 'My Tasks',  icon: CheckSquare },
                { href: '/timeline',  label: 'Timeline',  icon: GanttChart },
                { href: '/analytics', label: 'Analytics', icon: BarChart2 },
                { href: '/settings',  label: 'Settings',  icon: Settings },
              ].map(({ href, label, icon: Icon }) => (
                <Command.Item
                  key={href}
                  value={label}
                  onSelect={() => go(href)}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Projects" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider mt-1">
                {projects.map(p => (
                  <Command.Item
                    key={p.id}
                    value={p.title}
                    onSelect={() => go(`/projects/${p.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted"
                  >
                    <div className={`h-2 w-2 rounded-full shrink-0 ${statusColor[p.status] ?? 'bg-muted-foreground'}`} />
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {clients.length > 0 && (
              <Command.Group heading="Clients" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider mt-1">
                {clients.map(c => (
                  <Command.Item
                    key={c.id}
                    value={c.name}
                    onSelect={() => go(`/clients/${c.id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted"
                  >
                    <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-[10px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <span className="truncate">{c.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {tasks.length > 0 && (
              <Command.Group heading="Tasks" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider mt-1">
                {tasks.map(t => (
                  <Command.Item
                    key={t.id}
                    value={`${t.title} ${t.project?.title ?? ''}`}
                    onSelect={() => go(`/projects/${t.project_id}`)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm cursor-pointer aria-selected:bg-muted"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{t.title}</span>
                    {t.project && (
                      <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[120px]">
                        {t.project.title}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
