'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { KanbanBoard } from '@/components/work-orders/KanbanBoard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function KanbanPage() {
    const [workOrders, setWorkOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchOrders = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('work_orders')
                .select('*, assets(name), operators(full_name)')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching work orders:', error)
            } else {
                setWorkOrders(data || [])
            }
            setIsLoading(false)
        }

        fetchOrders()

        const supabase = createClient()
        const channel = supabase
            .channel('kanban-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => {
                fetchOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Cargando tablero...</div>
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4">
                    <Link href="/work-orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tablero Kanban</h1>
                        <p className="text-sm text-muted-foreground">Gestión visual del flujo de trabajo</p>
                    </div>
                </div>
                <Link href="/work-orders/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Orden
                    </Button>
                </Link>
            </div>

            <div className="flex-1 overflow-x-auto px-4 pb-4">
                <KanbanBoard initialOrders={workOrders} />
            </div>
        </div>
    )
}
