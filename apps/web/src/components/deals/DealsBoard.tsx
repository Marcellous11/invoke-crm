'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { DealsColumn } from './DealsColumn'
import { DealCard } from './DealCard'
import { reorderDealsAction } from '@/app/actions/deals'
import { DEAL_PIPELINE_COLUMNS } from '@invoke/types'
import type { Deal, DealStage } from '@invoke/types'

interface DealsBoardProps {
  initialDeals: Deal[]
}

export function DealsBoard({ initialDeals }: DealsBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const dealsByColumn = useCallback(() => {
    const map = {} as Record<DealStage, Deal[]>
    for (const col of DEAL_PIPELINE_COLUMNS) {
      map[col.id] = deals
        .filter((d) => d.stage === col.id)
        .sort((a, b) => a.position - b.position)
    }
    return map
  }, [deals])()

  function findDealColumn(dealId: string): DealStage | null {
    return deals.find((d) => d.id === dealId)?.stage ?? null
  }

  function onDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id)
    if (deal) setActiveDeal(deal)
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumn = findDealColumn(activeId)
    const overColumn = (DEAL_PIPELINE_COLUMNS.some((c) => c.id === overId)
      ? overId
      : findDealColumn(overId)) as DealStage | null

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    setDeals((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, stage: overColumn } : d))
    )
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDealItem = deals.find((d) => d.id === activeId)
    if (!activeDealItem) return

    const overIsColumn = DEAL_PIPELINE_COLUMNS.some((c) => c.id === overId)
    const targetColumn = overIsColumn ? (overId as DealStage) : findDealColumn(overId)
    if (!targetColumn) return

    const columnDeals = deals
      .filter((d) => d.stage === targetColumn)
      .sort((a, b) => a.position - b.position)

    if (activeDealItem.stage === targetColumn && !overIsColumn) {
      const oldIndex = columnDeals.findIndex((d) => d.id === activeId)
      const newIndex = columnDeals.findIndex((d) => d.id === overId)
      if (oldIndex === newIndex) return

      const reordered = arrayMove(columnDeals, oldIndex, newIndex)
      const updates = reordered.map((d, i) => ({ id: d.id, position: i, stage: targetColumn }))

      setDeals((prev) =>
        prev.map((d) => {
          const u = updates.find((u) => u.id === d.id)
          return u ? { ...d, position: u.position } : d
        })
      )
      reorderDealsAction(updates)
    } else {
      const position = columnDeals.filter((d) => d.id !== activeId).length
      const updates = [{ id: activeId, position, stage: targetColumn }]
      setDeals((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, stage: targetColumn, position } : d))
      )
      reorderDealsAction(updates)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {DEAL_PIPELINE_COLUMNS.map((col) => (
          <DealsColumn
            key={col.id}
            id={col.id}
            title={col.title}
            deals={dealsByColumn[col.id]}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDeal && <DealCard deal={activeDeal} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
