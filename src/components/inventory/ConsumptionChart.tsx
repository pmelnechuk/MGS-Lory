'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface InventoryMovement {
    created_at: string
    quantity: number
    type: string
    inventory_items?: any // Removed from usage
}

export function ConsumptionChart() {
    const [data, setData] = useState<any[]>([])
    const [period, setPeriod] = useState(30) // days
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const endDate = new Date()
                const startDate = subDays(endDate, period)

                const { data, error } = await supabase
                    .from('inventory_movements')
                    .select('created_at, quantity, movement_type')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: true })

                if (error) throw error

                const movements = data as unknown as InventoryMovement[]

                // Process data for chart
                const groupedData = new Map()

                // Initialize all days in range with 0
                for (let d = 0; d <= period; d++) {
                    const date = subDays(endDate, period - d)
                    const dateKey = format(date, 'yyyy-MM-dd')
                    groupedData.set(dateKey, {
                        date: format(date, 'dd MMM', { locale: es }),
                        consumption: 0,
                        purchase: 0
                    })
                }

                movements?.forEach(m => {
                    const dateKey = format(new Date(m.created_at), 'yyyy-MM-dd')
                    const current = groupedData.get(dateKey)

                    if (current) {
                        // Check movement_type instead of type
                        // @ts-ignore
                        const type = m.movement_type || m.type

                        if (type === 'OUT' || type === 'consumption') {
                            current.consumption += Math.abs(m.quantity)
                        } else if (type === 'IN' || type === 'purchase') {
                            current.purchase += Math.abs(m.quantity)
                        }
                    }
                })

                setData(Array.from(groupedData.values()))
            } catch (error) {
                console.error('Error fetching consumption data:', JSON.stringify(error, null, 2))
                console.error('Full error object:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [period])

    return (
        <Card className="col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Tendencias de Movimientos</CardTitle>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod(7)}
                            className={`text-xs px-2 py-1 rounded ${period === 7 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                            7D
                        </button>
                        <button
                            onClick={() => setPeriod(30)}
                            className={`text-xs px-2 py-1 rounded ${period === 30 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setPeriod(90)}
                            className={`text-xs px-2 py-1 rounded ${period === 90 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                        >
                            90D
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    {isLoading ? (
                        <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse rounded-lg">
                            Cargando datos...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip />
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
                                    dataKey="purchase"
                                    name="Entradas"
                                    stroke="#22c55e"
                                    fillOpacity={1}
                                    fill="url(#colorPurchase)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
