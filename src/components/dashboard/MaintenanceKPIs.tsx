'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, TrendingUp, TrendingDown, DollarSign, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getMaintenanceMetrics } from '@/lib/analytics'

interface MetricsData {
    mtbf: number | null
    mttr: number | null
    availability: number | null
    totalCost: number
    preventiveRate: number
    avgDowntime: number
    trend?: 'up' | 'down' | 'stable'
}

export function MaintenanceKPIs() {
    const [metrics, setMetrics] = useState<MetricsData>({
        mtbf: null,
        mttr: null,
        availability: null,
        totalCost: 0,
        preventiveRate: 0,
        avgDowntime: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const { data: workOrders, error } = await supabase
                    .from('work_orders')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error

                if (workOrders) {
                    const calculated = getMaintenanceMetrics(workOrders, 30)
                    setMetrics({
                        mtbf: calculated.mtbf,
                        mttr: calculated.mttr,
                        availability: calculated.availability,
                        totalCost: calculated.totalCost,
                        preventiveRate: calculated.preventiveRate,
                        avgDowntime: calculated.avgDowntime
                    })
                }
            } catch (error) {
                console.error('Error fetching metrics:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchMetrics()

        // Real-time updates
        const channel = supabase
            .channel('metrics-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'work_orders'
            }, fetchMetrics)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const kpis = [
        {
            title: 'MTBF',
            subtitle: 'Tiempo Medio Entre Fallas',
            value: metrics.mtbf !== null ? `${metrics.mtbf}h` : 'N/A',
            description: 'Promedio últimos 6 meses',
            icon: Activity,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            tooltip: 'Mean Time Between Failures - Mayor es mejor'
        },
        {
            title: 'MTTR',
            subtitle: 'Tiempo Medio de Reparación',
            value: metrics.mttr !== null ? `${metrics.mttr}h` : 'N/A',
            description: 'Promedio últimos 6 meses',
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            tooltip: 'Mean Time To Repair - Menor es mejor'
        },
        {
            title: 'Disponibilidad',
            subtitle: 'Uptime del Equipo',
            value: metrics.availability !== null ? `${metrics.availability}%` : 'N/A',
            description: 'Último mes',
            icon: Gauge,
            color: metrics.availability && metrics.availability >= 95 ? 'text-green-600' : 'text-yellow-600',
            bg: metrics.availability && metrics.availability >= 95 ? 'bg-green-50' : 'bg-yellow-50',
            tooltip: 'Porcentaje de tiempo operativo'
        },
        {
            title: 'Costo Mantenimiento',
            subtitle: 'Mes Actual',
            value: `$${metrics.totalCost.toLocaleString()}`,
            description: 'Mano de obra + repuestos',
            icon: DollarSign,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            tooltip: 'Suma de labor_cost + parts_cost'
        },
        {
            title: 'Tasa Preventivo',
            subtitle: 'vs Correctivo',
            value: `${metrics.preventiveRate}%`,
            description: 'Último mes',
            icon: TrendingUp,
            color: metrics.preventiveRate >= 60 ? 'text-green-600' : 'text-red-600',
            bg: metrics.preventiveRate >= 60 ? 'bg-green-50' : 'bg-red-50',
            tooltip: 'Meta: >60% preventivo'
        },
        {
            title: 'Downtime Promedio',
            subtitle: 'Por Intervención',
            value: `${metrics.avgDowntime}h`,
            description: 'Último mes',
            icon: TrendingDown,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            tooltip: 'Tiempo promedio de inactividad'
        }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Métricas de Mantenimiento</h3>
                <Badge variant="outline" className="text-xs">
                    Actualizado en tiempo real
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon

                    return (
                        <Card
                            key={kpi.title}
                            className={cn(
                                "hover:shadow-lg transition-all cursor-help border-l-4",
                                kpi.bg.replace('bg-', 'border-l-')
                            )}
                            title={kpi.tooltip}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                            {kpi.title}
                                        </p>
                                        <p className="text-2xl font-bold mb-1 flex items-baseline gap-2">
                                            <span className={kpi.color}>{kpi.value}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{kpi.description}</p>
                                    </div>
                                    <div className={cn("p-3 rounded-full", kpi.bg)}>
                                        <Icon className={cn("h-5 w-5", kpi.color)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
