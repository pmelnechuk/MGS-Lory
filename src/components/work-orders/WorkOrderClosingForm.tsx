'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Search } from 'lucide-react'

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

    const [parts, setParts] = useState<PartUsage[]>([])
    const [inventoryItems, setInventoryItems] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItem, setSelectedItem] = useState<string>('')
    const [partQuantity, setPartQuantity] = useState('1')

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch inventory items for selection
    useEffect(() => {
        const fetchInventory = async () => {
            const { data } = await supabase
                .from('inventory_items')
                .select('id, name, price, unit, quantity')
                .gt('quantity', 0)
                .order('name')

            if (data) setInventoryItems(data)
        }
        fetchInventory()
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
                    parts_cost: totalPartsCost
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
                    movement_type: 'consumption', // Correct column name and value
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
        <div className="space-y-6 animate-in slide-in-from-top-2 border rounded-lg p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Notas de Solución</Label>
                        <Textarea
                            placeholder="Describe detalladamente la solución aplicada..."
                            value={solutionNotes}
                            onChange={(e) => setSolutionNotes(e.target.value)}
                            className="min-h-[120px] bg-background"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tiempo de Inactividad (hrs)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={downtimeHours}
                                onChange={(e) => setDowntimeHours(e.target.value)}
                                className="bg-background"
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
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Costo Mano de Obra ($)</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={laborCost}
                                onChange={(e) => setLaborCost(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Repuestos Utilizados</Label>

                    <div className="flex gap-2 items-end bg-white p-3 rounded-md border">
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs text-muted-foreground">Buscar Repuesto</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Filtrar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 h-9"
                                />
                            </div>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedItem}
                                onChange={(e) => setSelectedItem(e.target.value)}
                            >
                                <option value="">Seleccionar ítem...</option>
                                {filteredItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (Stock: {item.quantity} {item.unit}) - ${item.price}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-20 space-y-2">
                            <Label className="text-xs text-muted-foreground">Cant.</Label>
                            <Input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={partQuantity}
                                onChange={(e) => setPartQuantity(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <Button onClick={handleAddPart} size="sm" className="h-9">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {parts.length > 0 && (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {parts.map((part, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                    <div>
                                        <span className="font-medium">{part.itemName}</span>
                                        <div className="text-muted-foreground text-xs">
                                            {part.quantity} {part.unit} x ${part.cost} = ${(part.quantity * part.cost).toFixed(2)}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemovePart(index)} className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <div className="text-right font-medium pt-2 border-t">
                                Total Repuestos: ${parts.reduce((sum, p) => sum + (p.cost * p.quantity), 0).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !solutionNotes} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? 'Guardando...' : 'Confirmar Finalización'}
                </Button>
            </div>
        </div>
    )
}
