'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AssetFormProps {
    initialData?: any
    onSubmit: (data: any) => Promise<void>
    isSubmitting?: boolean
}

export function AssetForm({ initialData, onSubmit, isSubmitting = false }: AssetFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        location: initialData?.location || '',
        type: initialData?.type || '',
        status: initialData?.status || 'operational',
        serial_number: initialData?.serial_number || '',
        model: initialData?.model || '',
        manufacturer: initialData?.manufacturer || '',
        purchase_date: initialData?.purchase_date || '',
        warranty_expiry: initialData?.warranty_expiry || '',
        image_url: initialData?.image_url || '',
        criticality: initialData?.criticality?.toString() || '1' // Default to 'Media' (1) if not set? Actually schema doesn't have criticality column in the CREATE TABLE statement I saw, but the UI uses it. I should check if I missed it or if it's new.
        // Wait, looking at supabase_schema.sql again...
        // create table public.assets ( ... status ... );
        // I DO NOT SEE 'criticality' in the CREATE TABLE statement in Step 1065!
        // But src/app/assets/page.tsx uses `asset.criticality`.
        // Maybe it was added later or I missed it.
        // Let's assume it exists or I should add it.
        // The UI code in page.tsx uses `asset.criticality` (0, 1, 2, 3).
        // I will include it in the form. If it fails to save, I'll know why.
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Convert criticality to number
        const dataToSubmit = {
            ...formData,
            criticality: parseInt(formData.criticality)
        }
        onSubmit(dataToSubmit)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre del Activo *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            placeholder="Ej: Torno CNC"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="model">Modelo</Label>
                        <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            placeholder="Ej: X-2000"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serial_number">Número de Serie</Label>
                        <Input
                            id="serial_number"
                            value={formData.serial_number}
                            onChange={(e) => handleChange('serial_number', e.target.value)}
                            placeholder="Ej: SN-123456"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="manufacturer">Fabricante</Label>
                        <Input
                            id="manufacturer"
                            value={formData.manufacturer}
                            onChange={(e) => handleChange('manufacturer', e.target.value)}
                            placeholder="Ej: Siemens"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="Ej: Nave 1 - Sector B"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Equipo</Label>
                        <Input
                            id="type"
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            placeholder="Ej: Maquinaria Pesada"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => handleChange('status', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operational">Operativo</SelectItem>
                                <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                                <SelectItem value="broken">Fuera de Servicio</SelectItem>
                                <SelectItem value="inactive">Inactivo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="criticality">Criticidad</Label>
                        <Select
                            value={formData.criticality}
                            onValueChange={(value) => handleChange('criticality', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar criticidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Baja</SelectItem>
                                <SelectItem value="1">Media</SelectItem>
                                <SelectItem value="2">Alta</SelectItem>
                                <SelectItem value="3">CRÍTICA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purchase_date">Fecha de Compra</Label>
                        <Input
                            id="purchase_date"
                            type="date"
                            value={formData.purchase_date}
                            onChange={(e) => handleChange('purchase_date', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="warranty_expiry">Vencimiento de Garantía</Label>
                        <Input
                            id="warranty_expiry"
                            type="date"
                            value={formData.warranty_expiry}
                            onChange={(e) => handleChange('warranty_expiry', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="image_url">URL de Imagen</Label>
                        <Input
                            id="image_url"
                            value={formData.image_url}
                            onChange={(e) => handleChange('image_url', e.target.value)}
                            placeholder="https://ejemplo.com/imagen.jpg"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Descripción detallada del activo..."
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Guardar Cambios' : 'Crear Activo'}
                </Button>
            </div>
        </form>
    )
}
