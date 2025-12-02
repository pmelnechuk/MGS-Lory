'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface InventoryMovement {
    quantity: number
    type: string
    inventory_items: {
        name: string
        unit: string
    } | null
}

export function TopConsumers() {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchTopConsumers = async () => {
            try {
                // Fetch movements from last 30 days
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - 30)

                const { data, error } = await supabase
                    .from('inventory_movements')
                    .select('quantity, movement_type, inventory_items(name, unit)')
                    .gte('created_at', startDate.toISOString())
                    .eq('movement_type', 'consumption') // 'consumption' is the correct enum value for OUT/consumption

                if (error) throw error

                const movements = data as unknown as InventoryMovement[]

                // Aggregate consumption by item
                const consumptionMap = new Map()

                movements?.forEach(m => {
                    const itemName = m.inventory_items?.name || 'Desconocido'
                    const unit = m.inventory_items?.unit || 'u'
                    const qty = Math.abs(m.quantity)

                    if (consumptionMap.has(itemName)) {
                        const current = consumptionMap.get(itemName)
                        current.total += qty
                    } else {
                        consumptionMap.set(itemName, { name: itemName, total: qty, unit })
                    }
                })

                // Sort by total consumption and take top 5
                const sortedItems = Array.from(consumptionMap.values())
                    .sort((a: any, b: any) => b.total - a.total)
                    .slice(0, 5)

                // Calculate max for progress bar
                const maxConsumption = sortedItems.length > 0 ? sortedItems[0].total : 1

                setItems(sortedItems.map((item: any) => ({
                    ...item,
                    percentage: (item.total / maxConsumption) * 100
                })))

            } catch (error) {
                console.error('Error fetching top consumers:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTopConsumers()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Consumo (30 días)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay datos de consumo reciente.</p>
                ) : (
                    items.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium truncate max-w-[180px]" title={item.name}>{item.name}</span>
                                <span className="text-muted-foreground">{item.total} {item.unit}</span>
                            </div>
                            <Progress value={item.percentage} className="h-2" />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
