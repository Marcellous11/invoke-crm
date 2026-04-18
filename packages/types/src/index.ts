// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'member'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  phone: string | null
  address: string | null
  industry: string | null
  company_size: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
  // joined fields (optional)
  contacts?: Contact[]
  primary_contact?: Contact | null
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  client_id: string
  full_name: string
  email: string | null
  phone: string | null
  title: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

// ─── Project ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'completed' | 'on_hold'

export interface Project {
  id: string
  title: string
  description: string | null
  client_id: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_by: string
  created_at: string
  // joined fields (optional)
  client?: Pick<Client, 'id' | 'name' | 'logo_url'>
  members?: ProjectMember[]
}

export type ProjectMemberRole = 'owner' | 'member'

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectMemberRole
  user?: Pick<User, 'id' | 'full_name' | 'avatar_url' | 'email'>
}

// ─── Task ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string
  status: TaskStatus
  assignee_id: string | null
  priority: TaskPriority
  due_date: string | null
  start_date: string | null
  position: number
  created_at: string
  // joined fields (optional)
  assignee?: Pick<User, 'id' | 'full_name' | 'avatar_url'>
  labels?: TaskLabel[]
}

export interface TaskLabel {
  id: string
  task_id: string
  label: string
  color: string
}

// ─── Kanban helpers ───────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
]

// ─── API response helpers ─────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
}
