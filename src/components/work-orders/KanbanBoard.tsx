'use client'

import { useState, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { supabase } from '@/lib/supabase'

interface KanbanBoardProps {
    initialOrders: any[]
}

const COLUMNS = [
    { id: 'pending', title: 'Pendientes', color: 'bg-slate-100 border-slate-200' },
    { id: 'approved', title: 'Aprobadas', color: 'bg-blue-50 border-blue-200' },
    { id: 'in_progress', title: 'En Progreso', color: 'bg-orange-50 border-orange-200' },
    { id: 'completed', title: 'Completadas', color: 'bg-green-50 border-green-200' },
]

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
    const [orders, setOrders] = useState(initialOrders)
    const [activeId, setActiveId] = useState<string | null>(null)

    useEffect(() => {
        setOrders(initialOrders)
    }, [initialOrders])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveTask = active.data.current?.type === 'Task'
        const isOverTask = over.data.current?.type === 'Task'

        if (!isActiveTask) return

        // Dropping a Task over another Task
        if (isActiveTask && isOverTask) {
            setOrders((orders) => {
                const activeIndex = orders.findIndex((t) => t.id === activeId)
                const overIndex = orders.findIndex((t) => t.id === overId)

                if (orders[activeIndex].status !== orders[overIndex].status) {
                    const newOrders = [...orders]
                    newOrders[activeIndex].status = orders[overIndex].status
                    return newOrders
                }

                return orders
            })
        }

        const isOverColumn = over.data.current?.type === 'Column'

        // Dropping a Task over a Column
        if (isActiveTask && isOverColumn) {
            setOrders((orders) => {
                const activeIndex = orders.findIndex((t) => t.id === activeId)
                const newOrders = [...orders]
                newOrders[activeIndex].status = overId
                return newOrders
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = event

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeTask = orders.find((t) => t.id === activeId)
        const overTask = orders.find((t) => t.id === overId)

        let newStatus = overId

        if (overTask) {
            newStatus = overTask.status
        }

        if (activeTask && activeTask.status !== newStatus) {
            // Update local state
            setOrders((orders) => {
                const newOrders = orders.map(o =>
                    o.id === activeId ? { ...o, status: newStatus } : o
                )
                return newOrders
            })

            // Update Supabase
            try {
                const updates: { status?: string; started_at?: string; completed_at?: string } = { status: newStatus }

                // Set timestamps based on status transition
                if (newStatus === 'in_progress' && !activeTask.started_at) {
                    updates.started_at = new Date().toISOString()
                } else if (newStatus === 'completed' && !activeTask.completed_at) {
                    updates.completed_at = new Date().toISOString()
                }

                const { error } = await (supabase
                    .from('work_orders') as any)
                    .update(updates)
                    .eq('id', activeId)

                if (error) throw error
            } catch (error) {
                console.error('Error updating order status:', error)
                // Revert on error (optional implementation)
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-full min-w-full">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        orders={orders.filter((o) => o.status === col.id)}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <KanbanCard
                        order={orders.find((o) => o.id === activeId)}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
