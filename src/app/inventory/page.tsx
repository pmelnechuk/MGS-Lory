'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    Package,
    AlertTriangle,
    ArrowRight,
    Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'


const CATEGORY_CONFIG = {
    repuesto: { label: 'Repuestos', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    consumible: { label: 'Consumibles', color: 'bg-green-100 text-green-700 border-green-200' },
    herramienta: { label: 'Herramientas', color: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const { data, error } = await supabase
                    .from('inventory_items')
                    .select('*')
                    .order('name')

                if (error) throw error
                if (data) setItems(data)
            } catch (error) {
                console.error('Error fetching inventory:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchItems()

        const channel = supabase
            .channel('inventory-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => {
                fetchItems()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter ? item.category === categoryFilter : true
        return matchesSearch && matchesCategory
    })

    const exportToPDF = () => {
        const doc = new jsPDF()

        doc.text('Reporte de Inventario', 14, 15)
        doc.setFontSize(10)
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22)

        const tableData = filteredItems.map(item => [
            item.name,
            item.sku,
            item.category,
            item.quantity,
            item.unit,
            item.location || '-',
            `$${item.price}`
        ])

        autoTable(doc, {
            head: [['Nombre', 'SKU', 'Categoría', 'Cant.', 'Unidad', 'Ubicación', 'Precio']],
            body: tableData,
            startY: 30,
        })

        doc.save('inventario.pdf')
    }

    // Calculate stats
    const totalItems = items.length
    const lowStockItems = items.filter(i => i.quantity <= i.min_quantity).length
    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Cargando inventario...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-muted-foreground">Gestión de repuestos, consumibles y herramientas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToPDF}>
                        Exportar PDF
                    </Button>
                    <Link href="/inventory/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Artículo
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Artículos</p>
                            <h2 className="text-3xl font-bold">{totalItems}</h2>
                        </div>
                        <Package className="h-8 w-8 text-primary/20" />
                    </CardContent>
                </Card>
                <Card className={cn(lowStockItems > 0 ? "border-destructive/50 bg-destructive/5" : "")}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Stock Bajo / Crítico</p>
                            <h2 className={cn("text-3xl font-bold", lowStockItems > 0 ? "text-destructive" : "")}>
                                {lowStockItems}
                            </h2>
                        </div>
                        <AlertTriangle className={cn("h-8 w-8", lowStockItems > 0 ? "text-destructive/50" : "text-muted/20")} />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                            <h2 className="text-3xl font-bold">${totalValue.toLocaleString()}</h2>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            $
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, SKU..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setCategoryFilter(null)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                            !categoryFilter ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                        )}
                    >
                        Todos
                    </button>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setCategoryFilter(key)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                                categoryFilter === key ? "bg-muted font-bold" : "bg-background hover:bg-muted"
                            )}
                        >
                            {config.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory List */}
            <div className="space-y-4">
                {filteredItems.map((item) => {
                    const isLowStock = item.quantity <= item.min_quantity
                    const isCritical = item.quantity === 0

                    return (
                        <Link href={`/inventory/${item.id}`} key={item.id}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn(
                                                    CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.color || 'bg-gray-100'
                                                )}>
                                                    {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]?.label || item.category}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground font-mono">{item.sku}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Ubicación: {item.location}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Stock Actual</p>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className={cn(
                                                        "text-2xl font-bold",
                                                        isCritical ? "text-destructive" :
                                                            isLowStock ? "text-orange-500" : "text-foreground"
                                                    )}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                                                </div>
                                                {isLowStock && (
                                                    <span className="text-xs font-medium text-destructive flex items-center justify-end gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {isCritical ? 'Sin Stock' : 'Stock Bajo'}
                                                    </span>
                                                )}
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
