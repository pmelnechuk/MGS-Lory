'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateMTBF, calculateMTTR, calculateAvailability } from '@/lib/analytics'
import {
    Activity,
    Clock,
    Wrench,
    TrendingUp
} from 'lucide-react'

interface AssetMetricsProps {
    assetId: number
}

interface WorkOrder {
    id: number
    created_at: string
    started_at: string | null
    completed_at: string | null
    downtime_hours: number | null
    parts_cost: number | null
    labor_cost: number | null
    type: 'preventive' | 'corrective'
    status: string
    asset_id?: number
}

export function AssetMetrics({ assetId }: AssetMetricsProps) {
    const [metrics, setMetrics] = useState({
        mtbf: 0,
        mttr: 0,
        availability: 0,
        totalDowntime: 0,
        totalCost: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data, error } = await supabase
                    .from('work_orders')
                    .select('*')
                    .eq('asset_id', assetId)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })

                if (error) throw error

                const workOrders = data as WorkOrder[]

                if (workOrders) {
                    // Cast to any to avoid strict null vs undefined issues with the analytics library
                    const mtbf = calculateMTBF(workOrders as any) || 0
                    const mttr = calculateMTTR(workOrders as any) || 0
                    const availability = calculateAvailability(workOrders as any) || 0

                    const totalDowntime = workOrders.reduce((acc, wo) => acc + (wo.downtime_hours || 0), 0)
                    const totalCost = workOrders.reduce((acc, wo) => acc + (wo.parts_cost || 0) + (wo.labor_cost || 0), 0)

                    setMetrics({
                        mtbf,
                        mttr,
                        availability,
                        totalDowntime,
                        totalCost
                    })
                }
            } catch (error) {
                console.error('Error fetching asset metrics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMetrics()
    }, [assetId])

    if (isLoading) {
        return <div className="h-32 animate-pulse bg-muted rounded-lg" />
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MTBF Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MTBF</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(metrics.mtbf || 0).toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">
                        Tiempo medio entre fallas
                    </p>
                </CardContent>
            </Card>

            {/* MTTR Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">MTTR</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(metrics.mttr || 0).toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">
                        Tiempo medio de reparación
                    </p>
                </CardContent>
            </Card>

            {/* Availability Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${metrics.availability >= 95 ? 'text-green-600' :
                        metrics.availability >= 90 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {(metrics.availability || 0).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Uptime total del equipo
                    </p>
                </CardContent>
            </Card>

            {/* Total Cost Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(metrics.totalCost || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                        Mantenimiento acumulado
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
