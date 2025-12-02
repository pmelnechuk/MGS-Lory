'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
    column: {
        id: string
        title: string
        color: string
    }
    orders: any[]
}

export function KanbanColumn({ column, orders }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
    })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col w-80 min-w-[320px] rounded-lg border h-full bg-slate-50/50",
                column.color
            )}
        >
            <div className="p-4 font-semibold flex items-center justify-between border-b bg-white/50 rounded-t-lg">
                <span>{column.title}</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                    {orders.length}
                </span>
            </div>

            <div className="flex-1 p-2 overflow-y-auto space-y-2">
                <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                    {orders.map((order) => (
                        <KanbanCard key={order.id} order={order} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}
