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
  parent_task_id: string | null
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
  subtasks?: Task[]
  project?: Pick<Project, 'id' | 'title'>
}

export interface TaskLabel {
  id: string
  task_id: string
  label: string
  color: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string
  body: string
  edited_at: string | null
  created_at: string
  // joined
  author?: Pick<User, 'id' | 'full_name' | 'avatar_url'>
}

export interface TaskAttachment {
  id: string
  task_id: string
  uploaded_by: string
  storage_path: string
  filename: string
  size_bytes: number
  mime_type: string | null
  created_at: string
  // joined
  uploader?: Pick<User, 'id' | 'full_name' | 'avatar_url'>
}

export type TaskEventKind =
  | 'created'
  | 'status_changed'
  | 'assignee_changed'
  | 'priority_changed'
  | 'due_date_changed'
  | 'title_changed'

export interface TaskEvent {
  id: string
  task_id: string
  actor_id: string | null
  kind: TaskEventKind
  from_value: string | null
  to_value: string | null
  created_at: string
  // joined
  actor?: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
}

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task'

export interface Activity {
  id: string
  client_id: string | null
  contact_id: string | null
  project_id: string | null
  type: ActivityType
  subject: string
  body: string | null
  occurred_at: string
  created_by: string
  created_at: string
  // joined fields (optional)
  author?: Pick<User, 'id' | 'full_name' | 'avatar_url'>
  contact?: Pick<Contact, 'id' | 'full_name'> | null
}

// ─── Deal ────────────────────────────────────────────────────────────────────

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export interface Deal {
  id: string
  client_id: string
  primary_contact_id: string | null
  title: string
  description: string | null
  stage: DealStage
  value_cents: number | null
  currency: string
  probability: number | null
  expected_close_date: string | null
  owner_id: string | null
  project_id: string | null
  lost_reason: string | null
  position: number
  created_by: string
  created_at: string
  updated_at: string
  // joined fields (optional)
  client?: Pick<Client, 'id' | 'name'>
  owner?: Pick<User, 'id' | 'full_name' | 'avatar_url'> | null
  primary_contact?: Pick<Contact, 'id' | 'full_name' | 'email'> | null
}

// ─── Kanban helpers ───────────────────────────────────────────────────────────

export const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
]

export const DEAL_PIPELINE_COLUMNS: { id: DealStage; title: string }[] = [
  { id: 'lead',        title: 'Lead' },
  { id: 'qualified',   title: 'Qualified' },
  { id: 'proposal',    title: 'Proposal' },
  { id: 'negotiation', title: 'Negotiation' },
  { id: 'won',         title: 'Won' },
  { id: 'lost',        title: 'Lost' },
]

// ─── API response helpers ─────────────────────────────────────────────────────

export interface ApiError {
  message: string
  code?: string
}
