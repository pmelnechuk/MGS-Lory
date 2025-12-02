'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, User, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface KanbanCardProps {
    order: any
    isOverlay?: boolean
}

const PRIORITY_CONFIG = {
    low: { color: 'bg-slate-100 text-slate-700 border-slate-200' },
    medium: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
    high: { color: 'bg-orange-100 text-orange-700 border-orange-200' },
    critical: { color: 'bg-red-100 text-red-700 border-red-200 animate-pulse' },
}

export function KanbanCard({ order, isOverlay }: KanbanCardProps) {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: order.id,
        data: {
            type: 'Task',
            order,
        },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-slate-200 h-[150px] rounded-lg border-2 border-dashed border-slate-400"
            />
        )
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn("touch-none", isOverlay && "rotate-2 scale-105 shadow-xl cursor-grabbing")}
        >
            <Link href={`/work-orders/${order.id}`} onClick={(e) => isOverlay && e.preventDefault()}>
                <Card className={cn(
                    "cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white",
                    isOverlay ? "shadow-xl border-primary/50" : "shadow-sm"
                )}>
                    <CardContent className="p-3 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                            <Badge variant="outline" className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                PRIORITY_CONFIG[order.priority as keyof typeof PRIORITY_CONFIG]?.color
                            )}>
                                {order.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">#{order.id}</span>
                        </div>

                        <div>
                            <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
                                {order.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {order.assets?.name || 'Sin activo'}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                {order.type === 'preventive' ? (
                                    <Clock className="h-3 w-3" />
                                ) : (
                                    <Wrench className="h-3 w-3" />
                                )}
                                <span className="capitalize">{order.type}</span>
                            </div>

                            {order.operators && (
                                <div className="flex items-center gap-1" title={order.operators.full_name}>
                                    <User className="h-3 w-3" />
                                    <span className="max-w-[80px] truncate">{order.operators.full_name.split(' ')[0]}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
