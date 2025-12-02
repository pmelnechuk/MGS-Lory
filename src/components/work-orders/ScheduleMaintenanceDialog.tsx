'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Calendar, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScheduleMaintenanceDialogProps {
    defaultAssetId?: number
    trigger?: React.ReactNode
}

export function ScheduleMaintenanceDialog({ defaultAssetId, trigger }: ScheduleMaintenanceDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedAssetId, setSelectedAssetId] = useState<string>(defaultAssetId?.toString() || '')
    const [assets, setAssets] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open && !defaultAssetId) {
            const fetchAssets = async () => {
                const { data } = await supabase
                    .from('assets')
                    .select('id, name, location')
                    .order('name')
                if (data) setAssets(data)
            }
            fetchAssets()
        }
    }, [open, defaultAssetId])

    const handleSubmit = async () => {
        if (!selectedAssetId || !title) return

        setIsSubmitting(true)
        try {
            const { error } = await (supabase
                .from('work_orders') as any)
                .insert({
                    title: title,
                    description: description,
                    asset_id: parseInt(selectedAssetId),
                    type: 'preventive',
                    priority: 'medium',
                    status: 'pending'
                } as any)

            if (error) throw error

            setOpen(false)
            setTitle('')
            setDescription('')
            if (!defaultAssetId) setSelectedAssetId('')

            router.refresh()
        } catch (error) {
            console.error('Error scheduling maintenance:', error)
            alert('Error al programar mantenimiento.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Programar Mantenimiento
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-l-4 border-l-blue-500">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-600">
                        <Wrench className="h-5 w-5" />
                        Programar Mantenimiento
                    </DialogTitle>
                    <DialogDescription>
                        Crear una nueva Orden de Trabajo Preventiva para este activo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {!defaultAssetId && (
                        <div className="grid gap-2">
                            <Label htmlFor="asset">Activo</Label>
                            <select
                                id="asset"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedAssetId}
                                onChange={(e) => setSelectedAssetId(e.target.value)}
                            >
                                <option value="">Seleccionar activo...</option>
                                {assets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.name} ({asset.location})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título de la Tarea</Label>
                        <Input
                            id="title"
                            placeholder="Ej: Mantenimiento Semanal, Cambio de Aceite..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción / Instrucciones</Label>
                        <Textarea
                            id="description"
                            placeholder="Detalles adicionales sobre el trabajo a realizar..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedAssetId || !title}
                    >
                        {isSubmitting ? 'Guardando...' : 'Crear Orden'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
