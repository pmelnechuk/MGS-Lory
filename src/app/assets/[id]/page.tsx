'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Settings,
    FileText,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Wrench,
    Pencil,
    MapPin,
    Box,
    ShieldCheck,
    Calendar
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AssetMetrics } from '@/components/assets/AssetMetrics'
import { InterventionHistory } from '@/components/assets/InterventionHistory'
import { ReportFailureDialog } from '@/components/work-orders/ReportFailureDialog'
import { ScheduleMaintenanceDialog } from '@/components/work-orders/ScheduleMaintenanceDialog'
import { MaintenancePlanList } from '@/components/maintenance/MaintenancePlanList'
import { ImageUpload } from '@/components/ui/image-upload'

const STATUS_CONFIG = {
    operational: { label: 'Operativo', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    maintenance: { label: 'En Mantenimiento', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    repair: { label: 'En Reparación', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Wrench },
    retired: { label: 'Retirado', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
}

const CRITICALITY_LABELS = ['Baja', 'Media', 'Alta', 'CRÍTICA']

export default function AssetDetailPage() {
    const params = useParams()
    const id = Number(params.id)
    const [asset, setAsset] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const { data, error } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) throw error
                if (data) setAsset(data)
            } catch (error) {
                console.error('Error fetching asset:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (id) fetchAsset()
    }, [id])

    const handleImageUpdate = async (url: string) => {
        try {
            const { error } = await supabase
                .from('assets')
                .update({ image_url: url })
                .eq('id', id)

            if (error) throw error
            setAsset({ ...asset, image_url: url })
        } catch (error) {
            console.error('Error updating image:', error)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-96">Cargando activo...</div>
    }

    if (!asset) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold text-muted-foreground">Activo no encontrado</h2>
                <Link href="/assets" className="mt-4 text-primary hover:underline">
                    Volver al listado
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header y Botón Volver */}
            <div className="flex items-center gap-4">
                <Link href="/assets">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{asset.location}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <Link href={`/assets/${id}/edit`}>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Información Principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Tarjeta de Estado e Imagen */}
                    <Card className="overflow-hidden">
                        <div className="p-6 flex flex-col items-center">
                            <ImageUpload
                                value={asset.image_url}
                                onChange={handleImageUpdate}
                                onRemove={() => handleImageUpdate('')}
                                className="w-[200px] h-[200px]"
                            />
                            <div className="mt-4">
                                <Badge className={cn(
                                    "text-sm px-3 py-1 shadow-lg border",
                                    STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG]?.color || "bg-gray-500"
                                )}>
                                    {STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG]?.label || asset.status}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Modelo</h3>
                                    <p>{asset.model || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Número de Serie</h3>
                                    <p>{asset.serial_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Fabricante</h3>
                                    <p>{asset.manufacturer || 'N/A'}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Fecha de Compra</h3>
                                    <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Descripción</h3>
                                <p className="text-sm leading-relaxed text-slate-600">
                                    {asset.description || 'Sin descripción disponible.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Métricas del Activo */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Métricas de Rendimiento</h2>
                        <AssetMetrics assetId={asset.id} />
                    </section>

                    {/* Historial de Intervenciones */}
                    <section>
                        <InterventionHistory assetId={asset.id} />
                    </section>

                    {/* Plan de Mantenimiento */}
                    <section>
                        <MaintenancePlanList assetId={asset.id} />
                    </section>
                </div>

                {/* Columna Derecha: Acciones y Detalles Adicionales */}
                <div className="space-y-6">
                    {/* Acciones Rápidas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ReportFailureDialog defaultAssetId={asset.id} trigger={
                                <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Reportar Falla
                                </Button>
                            } />
                            <ScheduleMaintenanceDialog defaultAssetId={asset.id} trigger={
                                <Button variant="outline" className="w-full">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Programar Mantenimiento
                                </Button>
                            } />
                            <Link href={`/assets/${asset.id}/maintenance-closing`}>
                                <Button variant="outline" className="w-full">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Cierre Mensual
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Información de Garantía */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                                Garantía
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Estado</p>
                                    <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                                        Vigente
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vencimiento</p>
                                    <p className="font-medium">
                                        {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
