'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Search, User, Clock, DollarSign, Wrench } from 'lucide-react'

interface WorkOrderClosingFormProps {
    workOrderId: number
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

export function WorkOrderClosingForm({ workOrderId, onComplete, onCancel }: WorkOrderClosingFormProps) {
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
            const { error: woError } = await supabase
                .from('work_orders')
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
                await supabase.from('work_order_parts').insert({
                    work_order_id: workOrderId,
                    inventory_item_id: part.itemId,
                    quantity: part.quantity,
                    unit_cost: part.cost
                } as any)

                // Create inventory movement
                await supabase.from('inventory_movements').insert({
                    item_id: part.itemId,
                    movement_type: 'consumption',
                    quantity: -part.quantity,
                    reference_id: workOrderId.toString(),
                    notes: `Usado en OT #${workOrderId}`
                } as any)

                // Update item stock
                const item = inventoryItems.find(i => i.id === part.itemId)
                if (item) {
                    await supabase
                        .from('inventory_items')
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
        <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Operator */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-primary" />
                                Detalles de Ejecución
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <Label>Notas de Solución</Label>
                                <Textarea
                                    placeholder="Describe detalladamente la solución aplicada..."
                                    value={solutionNotes}
                                    onChange={(e) => setSolutionNotes(e.target.value)}
                                    className="min-h-[150px]"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Métricas de Tiempo y Costo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Tiempo Inactividad (hrs)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={downtimeHours}
                                        onChange={(e) => setDowntimeHours(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Horas Hombre</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={laborHours}
                                        onChange={(e) => setLaborHours(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Costo Mano de Obra ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={laborCost}
                                            onChange={(e) => setLaborCost(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Spare Parts */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wrench className="h-5 w-5 text-primary" />
                                Repuestos Utilizados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Buscar Repuesto</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Filtrar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 h-9 bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Seleccionar Ítem</Label>
                                    <select
                                        className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={selectedItem}
                                        onChange={(e) => setSelectedItem(e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {filteredItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} (Stock: {item.quantity})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs font-medium">Cantidad</Label>
                                        <Input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={partQuantity}
                                            onChange={(e) => setPartQuantity(e.target.value)}
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                    <Button onClick={handleAddPart} size="sm" className="h-9 w-9 p-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Ítems Agregados</Label>
                                {parts.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                                        No se han agregado repuestos
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {parts.map((part, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm text-sm group">
                                                <div>
                                                    <div className="font-medium">{part.itemName}</div>
                                                    <div className="text-muted-foreground text-xs mt-1">
                                                        {part.quantity} {part.unit} x ${part.cost}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">
                                                        ${(part.quantity * part.cost).toFixed(2)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemovePart(index)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {parts.length > 0 && (
                                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                                        <span className="font-medium">Total Repuestos</span>
                                        <span className="text-lg font-bold text-primary">
                                            ${parts.reduce((sum, p) => sum + (p.cost * p.quantity), 0).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t">
                <Button variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="bg-green-600 hover:bg-green-700 min-w-[200px]">
                    {isSubmitting ? 'Guardando...' : 'Confirmar Finalización'}
                </Button>
            </div>
        </div>
    )
}
