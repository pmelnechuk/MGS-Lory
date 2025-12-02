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
import { AlertTriangle, Siren } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReportFailureDialogProps {
    defaultAssetId?: number
    trigger?: React.ReactNode
}

export function ReportFailureDialog({ defaultAssetId, trigger }: ReportFailureDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
        if (!selectedAssetId || !description) return

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('work_orders')
                .insert({
                    title: 'Falla Reportada',
                    description: description,
                    asset_id: parseInt(selectedAssetId),
                    type: 'corrective',
                    priority: 'high',
                    status: 'pending'
                } as any)

            if (error) throw error

            setOpen(false)
            setDescription('')
            if (!defaultAssetId) setSelectedAssetId('')

            router.refresh()
            // Optional: Show success toast
        } catch (error) {
            console.error('Error reporting failure:', error)
            alert('Error al reportar la falla.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="destructive" className="gap-2">
                        <Siren className="h-4 w-4" />
                        Reportar Falla
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-l-4 border-l-destructive">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Reportar Falla de Equipo
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción generará una Orden de Trabajo Correctiva de alta prioridad y pondrá el equipo en estado de REPARACIÓN.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {!defaultAssetId && (
                        <div className="grid gap-2">
                            <Label htmlFor="asset">Activo Afectado</Label>
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
                        <Label htmlFor="description">Descripción del Problema</Label>
                        <Textarea
                            id="description"
                            placeholder="Describa qué sucedió, ruidos extraños, mensajes de error, etc."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedAssetId || !description}
                    >
                        {isSubmitting ? 'Reportando...' : 'Confirmar Falla'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
