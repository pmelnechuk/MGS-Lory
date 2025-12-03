'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Search, User, Clock, DollarSign, Wrench, Calendar, AlertTriangle } from 'lucide-react'

interface WorkOrderClosingFormProps {
    workOrderId: number
    initialData: any
    onComplete: () => void
    onCancel: () => void
}

interface PartUsage {
    itemId: string
    itemName: string
    quantity: number
    cost: number
    unit: string
}

export function WorkOrderClosingForm({ workOrderId, initialData, onComplete, onCancel }: WorkOrderClosingFormProps) {
    const [solutionNotes, setSolutionNotes] = useState('')
    const [downtimeHours, setDowntimeHours] = useState('0')
    const [laborHours, setLaborHours] = useState('0')
    const [laborCost, setLaborCost] = useState('0')
    const [selectedOperator, setSelectedOperator] = useState<string>('')

    const [parts, setParts] = useState<PartUsage[]>([])
    const [inventoryItems, setInventoryItems] = useState<any[]>([])
    const [operators, setOperators] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItem, setSelectedItem] = useState<string>('')
    const [partQuantity, setPartQuantity] = useState('1')

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            // Fetch Inventory
            const { data: items } = await supabase
                .from('inventory_items')
                .select('id, name, price, unit, quantity')
                .gt('quantity', 0)
                .order('name')

            if (items) setInventoryItems(items)

            // Fetch Operators
            const { data: ops } = await supabase
                .from('operators')
                .select('id, full_name')
                .eq('is_active', true)
                .order('full_name')

            if (ops) setOperators(ops)
        }
        fetchData()
    }, [])

    const handleAddPart = () => {
        if (!selectedItem) return

        const item = inventoryItems.find(i => i.id === selectedItem)
        if (!item) return

        const qty = parseFloat(partQuantity)
        if (isNaN(qty) || qty <= 0) return

        if (qty > item.quantity) {
            alert(`Stock insuficiente. Disponible: ${item.quantity} ${item.unit}`)
            return
        }

        const newPart: PartUsage = {
            itemId: item.id,
            itemName: item.name,
            quantity: qty,
            cost: item.price,
            unit: item.unit
        }

        setParts([...parts, newPart])
        setSelectedItem('')
        setPartQuantity('1')
    }

    const handleRemovePart = (index: number) => {
        const newParts = [...parts]
        newParts.splice(index, 1)
        setParts(newParts)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const totalPartsCost = parts.reduce((sum, part) => sum + (part.cost * part.quantity), 0)

            // 1. Update Work Order
            const { error: woError } = await (supabase
                .from('work_orders') as any)
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    solution_notes: solutionNotes,
                    downtime_hours: parseFloat(downtimeHours) || 0,
                    labor_hours: parseFloat(laborHours) || 0,
                    labor_cost: parseFloat(laborCost) || 0,
                    parts_cost: totalPartsCost,
                    operator_id: selectedOperator ? parseInt(selectedOperator) : null
                } as any)
                .eq('id', workOrderId)

            if (woError) throw woError

            // 2. Record Parts Usage & Update Inventory
            for (const part of parts) {
                // Add to work_order_parts
                await (supabase.from('work_order_parts') as any).insert({
                    work_order_id: workOrderId,
                    inventory_item_id: part.itemId,
                    quantity: part.quantity,
                    unit_cost: part.cost
                } as any)

                // Create inventory movement
                await (supabase.from('inventory_movements') as any).insert({
                    item_id: part.itemId,
                    movement_type: 'consumption',
                    quantity: -part.quantity,
                    reference_id: workOrderId.toString(),
                    notes: `Usado en OT #${workOrderId}`
                } as any)

                // Update item stock
                const item = inventoryItems.find(i => i.id === part.itemId)
                if (item) {
                    await (supabase
                        .from('inventory_items') as any)
                        .update({ quantity: item.quantity - part.quantity } as any)
                        .eq('id', part.itemId)
                }
            }

            onComplete()
        } catch (error) {
            console.error('Error closing work order:', error)
            alert('Error al cerrar la orden. Por favor intente nuevamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredItems = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4 animate-in slide-in-from-top-2">
            {/* Top Header: Metadata */}
            <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Asignado:</span>
                        <span className="font-medium">{initialData.assigned_to || 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Creada:</span>
                        <span className="font-medium">{new Date(initialData.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Prioridad:</span>
                        <Badge variant={initialData.priority === 'high' ? 'destructive' : 'secondary'} className="h-5 text-xs">
                            {initialData.priority?.toUpperCase()}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="bg-green-600 hover:bg-green-700">
                        {isSubmitting ? 'Guardando...' : 'Confirmar Finalización'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Form (70%) */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Wrench className="h-5 w-5 text-primary" />
                                Informe Técnico
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Operator & Notes */}
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label>Operario Responsable</Label>
                                    <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar operario..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {operators.map(op => (
                                                <SelectItem key={op.id} value={op.id.toString()}>
                                                    {op.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descripción de la Solución</Label>
                                    <Textarea
                                        placeholder="Describe detalladamente el trabajo realizado..."
                                        value={solutionNotes}
                                        onChange={(e) => setSolutionNotes(e.target.value)}
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="pt-4 border-t">
                                <Label className="mb-3 block text-sm font-semibold text-muted-foreground">Métricas de Ejecución</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Tiempo Inactividad (hrs)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={downtimeHours}
                                                onChange={(e) => setDowntimeHours(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Horas Hombre</Label>
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={laborHours}
                                                onChange={(e) => setLaborHours(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Costo Mano de Obra ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={laborCost}
                                                onChange={(e) => setLaborCost(e.target.value)}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Spare Parts (30%) */}
                <div className="space-y-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Wrench className="h-5 w-5 text-primary" />
                                Repuestos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            {/* Controls */}
                            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Buscar</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Filtrar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 h-8 bg-white text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium">Ítem</Label>
                                    <select
                                        className="w-full h-8 rounded-md border border-input bg-white px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedItem}
                                        onChange={(e) => setSelectedItem(e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {filteredItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} ({item.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs font-medium">Cant.</Label>
                                        <Input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={partQuantity}
                                            onChange={(e) => setPartQuantity(e.target.value)}
                                            className="h-8 bg-white"
                                        />
                                    </div>
                                    <Button onClick={handleAddPart} size="sm" className="h-8 w-8 p-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 min-h-[200px] space-y-2 overflow-y-auto pr-1">
                                {parts.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                                        Sin repuestos
                                    </div>
                                ) : (
                                    parts.map((part, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-lg border shadow-sm text-sm group">
                                            <div className="overflow-hidden">
                                                <div className="font-medium truncate" title={part.itemName}>{part.itemName}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {part.quantity} {part.unit} x ${part.cost}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="font-semibold text-xs">
                                                    ${(part.quantity * part.cost).toFixed(2)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemovePart(index)}
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Total */}
                            {parts.length > 0 && (
                                <div className="flex justify-between items-center pt-3 border-t">
                                    <span className="font-medium text-sm">Total</span>
                                    <span className="text-base font-bold text-primary">
                                        ${parts.reduce((sum, p) => sum + (p.cost * p.quantity), 0).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
