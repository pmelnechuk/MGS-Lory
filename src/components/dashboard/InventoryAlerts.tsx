'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Package, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LowStockItem {
    id: number
    name: string
    sku: string
    category: string
    quantity: number
    min_quantity: number
    unit: string
    location?: string
}

export function InventoryAlerts() {
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchLowStock = async () => {
            try {
                // Fetch all items and filter in JavaScript since we need to compare columns
                const { data, error } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .order('quantity', { ascending: true })

                if (error) throw error

                // Filter items where quantity <= min_quantity
                const lowStock = data?.filter(item => item.quantity <= item.min_quantity) || []
                setLowStockItems(lowStock.slice(0, 5) as LowStockItem[])
            } catch (error) {
                console.error('Error fetching low stock items:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLowStock()

        // Real-time subscription
        const channel = supabase
            .channel('inventory-alerts')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'inventory_items'
            }, fetchLowStock)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const getSeverity = (item: LowStockItem) => {
        const percentage = (item.quantity / item.min_quantity) * 100
        if (percentage <= 0) return { level: 'critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '🔴' }
        if (percentage <= 50) return { level: 'warning', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: '🟡' }
        return { level: 'low', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟢' }
    }

    if (isLoading) {
        return (
            <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Cargando alertas...</p>
                </CardContent>
            </Card>
        )
    }

    if (lowStockItems.length === 0) {
        return (
            <Card className="border-green-200 bg-green-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <Package className="h-5 w-5" />
                        Stock en Niveles Óptimos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-600">
                        Todos los ítems de inventario están por encima del nivel mínimo.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-orange-200 bg-orange-50/30 animate-in slide-in-from-top-2">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-orange-700">
                        <AlertTriangle className="h-5 w-5" />
                        Alertas de Stock Bajo
                        <Badge variant="destructive" className="ml-2">
                            {lowStockItems.length}
                        </Badge>
                    </div>
                    <Link href="/inventory?filter=low-stock">
                        <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-800">
                            Ver Todo
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {lowStockItems.map((item) => {
                    const severity = getSeverity(item)
                    const shortage = Math.max(0, item.min_quantity - item.quantity)

                    return (
                        <Link key={item.id} href={`/inventory/${item.id}`}>
                            <div
                                className={cn(
                                    "p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer group",
                                    severity.bg,
                                    severity.border
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{severity.icon}</span>
                                            <h4 className="font-semibold text-sm group-hover:underline truncate">
                                                {item.name}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            SKU: {item.sku} • {item.category} • {item.location || 'Sin ubicación'}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <TrendingDown className={cn("h-3 w-3", severity.color)} />
                                                <span className={severity.color}>
                                                    Stock: <strong>{item.quantity}</strong> {item.unit}
                                                </span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                Mín: {item.min_quantity} {item.unit}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge
                                            variant={shortage > 0 ? "destructive" : "outline"}
                                            className="text-xs whitespace-nowrap"
                                        >
                                            {shortage > 0 ? `Faltan ${shortage}` : 'Stock Bajo'}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
    )
}
