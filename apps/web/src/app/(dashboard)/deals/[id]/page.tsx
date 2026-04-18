import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Pencil,
  Calendar,
  DollarSign,
  Percent,
  User as UserIcon,
  Building2,
  FolderKanban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DeleteDealButton } from '@/components/deals/DeleteDealButton'
import { ConvertDealButton } from '@/components/deals/ConvertDealButton'
import { ActivityComposer } from '@/components/activities/ActivityComposer'
import { ActivityTimeline } from '@/components/activities/ActivityTimeline'
import type { Activity, DealStage } from '@invoke/types'

const STAGE_META: Record<DealStage, { label: string; className: string }> = {
  lead:        { label: 'Lead',        className: 'bg-slate-100 text-slate-700' },
  qualified:   { label: 'Qualified',   className: 'bg-blue-100 text-blue-700' },
  proposal:    { label: 'Proposal',    className: 'bg-violet-100 text-violet-700' },
  negotiation: { label: 'Negotiation', className: 'bg-amber-100 text-amber-700' },
  won:         { label: 'Won',         className: 'bg-emerald-100 text-emerald-700' },
  lost:        { label: 'Lost',        className: 'bg-rose-100 text-rose-700' },
}

function formatValue(cents: number | null, currency: string) {
  if (cents == null) return null
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toLocaleString()}`
  }
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const { data: deal } = await supabase
    .from('deals')
    .select(`
      *,
      client:clients ( id, name ),
      owner:users!deals_owner_id_fkey ( id, full_name, avatar_url ),
      primary_contact:contacts ( id, full_name, email ),
      project:projects ( id, title )
    `)
    .eq('id', id)
    .single()

  if (!deal) notFound()

  const { data: activities } = await supabase
    .from('activities')
    .select('*, author:users!activities_created_by_fkey(id, full_name, avatar_url)')
    .eq('client_id', deal.client_id)
    .order('occurred_at', { ascending: false })
    .limit(50)

  const stage = STAGE_META[deal.stage as DealStage]
  const value = formatValue(deal.value_cents, deal.currency)
  const closeDate = deal.expected_close_date
    ? new Date(deal.expected_close_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null

  const canConvert = deal.stage === 'won' && !deal.project_id

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Deals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.className}`}>
              {stage.label}
            </span>
            {deal.client && (
              <Link
                href={`/clients/${deal.client.id}`}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {deal.client.name}
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold">{deal.title}</h1>
          {deal.description && (
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{deal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/deals/${id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
          <DeleteDealButton id={id} />
        </div>
      </div>

      {/* Convert banner */}
      {canConvert && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="text-sm">
              <p className="font-medium">Deal won — ready to deliver?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Create a project to start tracking work for this deal.
              </p>
            </div>
            <ConvertDealButton dealId={id} />
          </CardContent>
        </Card>
      )}

      {/* Linked project */}
      {deal.project && (
        <Link href={`/projects/${deal.project.id}`}>
          <Card className="mb-6 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Linked project</p>
                <p className="font-medium truncate">{deal.project.title}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Details grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-0 text-sm">
          {value && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{value}</span>
            </div>
          )}
          {deal.probability != null && (
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              {deal.probability}% probability
            </div>
          )}
          {closeDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              Close {closeDate}
            </div>
          )}
          {deal.owner && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={deal.owner.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {getInitials(deal.owner.full_name || '?')}
                </AvatarFallback>
              </Avatar>
              {deal.owner.full_name}
            </div>
          )}
          {deal.primary_contact && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{deal.primary_contact.full_name}</span>
              {deal.primary_contact.email && (
                <a href={`mailto:${deal.primary_contact.email}`} className="text-muted-foreground hover:underline text-xs">
                  {deal.primary_contact.email}
                </a>
              )}
            </div>
          )}
          {deal.stage === 'lost' && deal.lost_reason && (
            <div className="sm:col-span-2 mt-2 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Lost reason</p>
              <p className="whitespace-pre-wrap">{deal.lost_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <div>
        <h2 className="font-semibold mb-3">Activity</h2>
        <div className="space-y-4">
          <ActivityComposer clientId={deal.client_id} />
          <ActivityTimeline
            activities={(activities as Activity[]) ?? []}
            currentUserId={authUser!.id}
            clientId={deal.client_id}
          />
        </div>
      </div>
    </div>
  )
}
