'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    AlertTriangle,
    History,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_CONFIG = {
    repuesto: { label: 'Repuesto', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    consumible: { label: 'Consumible', color: 'bg-green-100 text-green-700 border-green-200' },
    herramienta: { label: 'Herramienta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export default function InventoryDetailPage() {
    const params = useParams()
    const id = Number(params.id)
    const [item, setItem] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [adjustmentAmount, setAdjustmentAmount] = useState('')
    const [isAdjusting, setIsAdjusting] = useState(false)

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const { data, error } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                if (data) setItem(data)
            } catch (error) {
                console.error('Error fetching item:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (id) fetchItem()
    }, [id])

    const handleAdjustment = async (type: 'add' | 'remove') => {
        if (!adjustmentAmount || isNaN(Number(adjustmentAmount))) return

        setIsAdjusting(true)
        const amount = Number(adjustmentAmount)
        const newQuantity = type === 'add'
            ? item.quantity + amount
            : item.quantity - amount

        if (newQuantity < 0) {
            alert('No hay suficiente stock para realizar esta salida.')
            setIsAdjusting(false)
            return
        }

        try {
            const { error } = await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity })
                .eq('id', id)

            if (error) throw error

            setItem({ ...item, quantity: newQuantity })
            setAdjustmentAmount('')
        } catch (error) {
            console.error('Error updating stock:', error)
            alert('Error al actualizar el stock')
        } finally {
            setIsAdjusting(false)
        }
    }

    if (isLoading) return <div className="flex justify-center items-center h-96">Cargando artículo...</div>
    if (!item) return (
        <div className="flex flex-col items-center justify-center h-96">
            <h2 className="text-2xl font-bold text-muted-foreground">Artículo no encontrado</h2>
            <Link href="/inventory" className="mt-4 text-primary hover:underline">
                Volver al inventario
            </Link>
        </div>
    )

    const isLowStock = item.quantity <= item.min_quantity
    const isCritical = item.quantity === 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/inventory">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
                        <Badge variant="outline" className={cn(
                            CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.color || 'bg-gray-100'
                        )}>
                            {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label || item.category}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-mono mt-1">SKU: {item.sku}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stock Status Card */}
                    <Card className={cn("overflow-hidden", isLowStock ? "border-destructive/50" : "")}>
                        <div className={cn("h-2", isLowStock ? "bg-destructive" : "bg-primary")} />
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Estado de Stock
                                {isLowStock && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {isCritical ? 'SIN STOCK' : 'STOCK BAJO'}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Disponible</span>
                                <span className={cn("text-4xl font-bold", isLowStock ? "text-destructive" : "text-primary")}>
                                    {item.quantity}
                                </span>
                                <span className="text-sm text-muted-foreground block mt-1">{item.unit}</span>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Mínimo Requerido</span>
                                <span className="text-4xl font-bold text-muted-foreground">{item.min_quantity}</span>
                                <span className="text-sm text-muted-foreground block mt-1">{item.unit}</span>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-lg">
                                <span className="text-sm text-muted-foreground block mb-1">Ubicación</span>
                                <span className="text-xl font-bold text-foreground mt-2 block">{item.location}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Adjustment */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ajuste Rápido de Inventario</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Cantidad a ajustar</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        disabled={isAdjusting}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    onClick={() => handleAdjustment('add')}
                                    disabled={isAdjusting}
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Ingreso
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => handleAdjustment('remove')}
                                    disabled={isAdjusting}
                                >
                                    <TrendingDown className="mr-2 h-4 w-4" />
                                    Salida
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                * Esto registrará un movimiento manual en el historial.
                            </p>
                        </CardContent>
                    </Card>

                    {/* History Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Historial de Movimientos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 relative pl-4 border-l-2 border-muted">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-background" />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">Ingreso de Material</p>
                                            <p className="text-xs text-muted-foreground">Compra Orden #4521</p>
                                        </div>
                                        <span className="text-green-600 font-bold text-sm">+50</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground block mt-1">Hace 2 días</span>
                                </div>
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-red-500 ring-4 ring-background" />
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-sm">Salida para Mantenimiento</p>
                                            <p className="text-xs text-muted-foreground">OT #124 - Compresor Principal</p>
                                        </div>
                                        <span className="text-red-600 font-bold text-sm">-2</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground block mt-1">Hace 5 días</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Precio Unitario</span>
                                <span className="font-medium">${item.price?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Valor Total Stock</span>
                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Última Actualización</span>
                                <span className="font-medium text-sm">{item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
