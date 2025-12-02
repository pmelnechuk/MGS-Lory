'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertTriangle,
    Camera,
    ArrowLeft,
    Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function CreateWorkOrderPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [assets, setAssets] = useState<any[]>([])
    const [operators, setOperators] = useState<any[]>([])
    const [formData, setFormData] = useState({
        assetId: '',
        description: '',
        priority: 'medium',
        operatorId: '',
        failureDate: new Date().toISOString().slice(0, 16) // Default to now, format for datetime-local
    })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: assetsData } = await supabase.from('assets').select('*').order('name')
            if (assetsData) setAssets(assetsData)

            const { data: operatorsData } = await supabase
                .from('operators')
                .select('*')
                .eq('is_active', true)
                .order('full_name')
            if (operatorsData) setOperators(operatorsData)
        }
        fetchData()
    }, [])

    const selectedAsset = assets.find(a => a.id.toString() === formData.assetId)
    const isCritical = selectedAsset?.criticality ? selectedAsset.criticality >= 2 : false

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.from('work_orders').insert({
                asset_id: Number(formData.assetId),
                description: formData.description,
                priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
                title: `Falla en ${selectedAsset?.name}`,
                type: 'corrective',
                status: 'pending',
                operator_id: formData.operatorId ? Number(formData.operatorId) : null,
                failure_date: new Date(formData.failureDate).toISOString(),
                created_at: new Date().toISOString()
            })

            if (error) throw error

            router.push('/work-orders')
        } catch (error) {
            console.error('Error creating work order:', error)
            alert('Error al crear la orden de trabajo')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/work-orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8" />
                        Reportar Falla
                    </h1>
                    <p className="text-muted-foreground">
                        Generar una Orden de Trabajo Correctiva (Emergencia/Rotura).
                    </p>
                </div>
            </div>

            <Card className="border-destructive/20 shadow-lg">
                <CardHeader>
                    <CardTitle>Detalles del Incidente</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Por favor describe el problema con el mayor detalle posible.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Asset Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="asset">Equipo / Activo Afectado</Label>
                            <select
                                id="asset"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.assetId}
                                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                                required
                            >
                                <option value="">Seleccionar equipo...</option>
                                {assets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.name} - {asset.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Criticality Alert */}
                        {isCritical && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-destructive">¡Atención! Equipo Crítico</h4>
                                    <p className="text-sm text-destructive/80">
                                        Este equipo es vital para la operación. Se notificará inmediatamente al Supervisor.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Failure Date Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="failureDate">Fecha y Hora de la Falla</Label>
                            <input
                                type="datetime-local"
                                id="failureDate"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.failureDate}
                                onChange={(e) => setFormData({ ...formData, failureDate: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Si la falla ocurrió antes, por favor indica la fecha y hora real.
                            </p>
                        </div>

                        {/* Priority Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">Prioridad</Label>
                            <select
                                id="priority"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                required
                            >
                                <option value="low">Baja</option>
                                <option value="medium">Media</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        {/* Operator Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="operator">Asignar Operario (Opcional)</Label>
                            <select
                                id="operator"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={formData.operatorId}
                                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                            >
                                <option value="">Sin asignar</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.id}>
                                        {op.full_name} ({op.specialty || 'General'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción de la Falla</Label>
                            <Textarea
                                id="description"
                                placeholder="Ej: El motor hace un ruido extraño y vibra mucho..."
                                className="min-h-[120px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                Puedes usar el dictado por voz de tu teclado móvil.
                            </p>
                        </div>

                        {/* Photo Upload Placeholder */}
                        <div className="space-y-2">
                            <Label>Evidencia Fotográfica (Opcional)</Label>
                            <div className="border-2 border-dashed border-input rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                                <Camera className="h-8 w-8 mb-2" />
                                <span className="text-sm">Tocar para tomar foto o subir archivo</span>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            size="lg"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando Reporte...
                                </>
                            ) : (
                                'ENVIAR REPORTE DE FALLA'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
