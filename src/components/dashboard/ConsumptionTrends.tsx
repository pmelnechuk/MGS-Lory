'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Calendar, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getConsumptionTrend } from '@/lib/analytics'

interface TrendData {
    month: string
    consumption: number
    purchases: number
}

export function ConsumptionTrends() {
    const [trendData, setTrendData] = useState<TrendData[]>([])
    const [period, setPeriod] = useState<7 | 30 | 90>(90)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                setIsLoading(true)
                const { data: movements, error } = await supabase
                    .from('inventory_movements')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error

                if (movements) {
                    const trends = getConsumptionTrend(movements as any[], undefined, period)
                    setTrendData(trends)
                }
            } catch (error) {
                console.error('Error fetching consumption trends:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTrends()
    }, [period])

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando tendencias...</p>
                </CardContent>
            </Card>
        )
    }

    if (trendData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tendencias de Consumo
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de movimientos de inventario</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tendencias de Consumo de Inventario
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant={period === 7 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(7)}
                        >
                            7 días
                        </Button>
                        <Button
                            variant={period === 30 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(30)}
                        >
                            30 días
                        </Button>
                        <Button
                            variant={period === 90 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(90)}
                        >
                            90 días
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="month"
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="consumption"
                            name="Consumo"
                            stroke="#ef4444"
                            fillOpacity={1}
                            fill="url(#colorConsumption)"
                        />
                        <Area
                            type="monotone"
                            dataKey="purchases"
                            name="Compras"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorPurchases)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-sm text-muted-foreground mb-1">Total Consumido</p>
                        <p className="text-2xl font-bold text-red-600">
                            {trendData.reduce((sum, d) => sum + d.consumption, 0)} unidades
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-sm text-muted-foreground mb-1">Total Comprado</p>
                        <p className="text-2xl font-bold text-green-600">
                            {trendData.reduce((sum, d) => sum + d.purchases, 0)} unidades
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
