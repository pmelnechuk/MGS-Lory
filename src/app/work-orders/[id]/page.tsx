'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    Play,
    StopCircle,
    AlertTriangle,
    User,
    Calendar,
    Wrench,
    FileDown
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { generateWorkOrderPDF } from '@/lib/pdf-generator'
import { WorkOrderClosingForm } from '@/components/work-orders/WorkOrderClosingForm'

const STATUS_CONFIG = {
    pending: { label: 'Pendiente', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' },
    approved: { label: 'Aprobada', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100' },
    in_progress: { label: 'En Progreso', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-100' },
    completed: { label: 'Completada', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
    cancelled: { label: 'Cancelada', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
}

export default function WorkOrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = Number(params.id)
    const [workOrder, setWorkOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCompleting, setIsCompleting] = useState(false)
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('work_orders')
                    .select('*, assets(*)')
                    .eq('id', id)
                    .single()

                if (error) throw error
                if (data) setWorkOrder(data)
            } catch (error) {
                console.error('Error fetching work order:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (id) fetchOrder()
    }, [id])

    if (isLoading) return <div className="flex justify-center items-center h-96">Cargando orden...</div>
    if (!workOrder) return <div>Orden no encontrada</div>

    const asset = workOrder.assets
    const StatusIcon = STATUS_CONFIG[workOrder.status as keyof typeof STATUS_CONFIG].icon

    const handleStartWork = async () => {
        try {
            const { error } = await (supabase
                .from('work_orders') as any)
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            setWorkOrder({
                ...workOrder,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error starting work:', error)
            alert('Error al iniciar el trabajo')
        }
    }

    const handleExportPDF = async () => {
        if (!workOrder) return
        await generateWorkOrderPDF(workOrder)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/work-orders">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">OT #{workOrder.id}</h1>
                        <Badge variant="outline" className={cn(
                            "text-sm px-3 py-1",
                            STATUS_CONFIG[workOrder.status as keyof typeof STATUS_CONFIG].bg,
                            STATUS_CONFIG[workOrder.status as keyof typeof STATUS_CONFIG].color
                        )}>
                            <StatusIcon className="mr-2 h-4 w-4" />
                            {STATUS_CONFIG[workOrder.status as keyof typeof STATUS_CONFIG].label}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        {workOrder.type === 'preventivo' ? 'Mantenimiento Preventivo' : 'Mantenimiento Correctivo'}
                    </p>
                </div>
                <Button variant="outline" onClick={handleExportPDF}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Trabajo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{workOrder.title}</h3>
                                <p className="text-muted-foreground mt-2 leading-relaxed">
                                    {workOrder.description}
                                </p>
                            </div>

                            {workOrder.solution_notes && (
                                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mt-4">
                                    <h4 className="font-semibold text-green-800 mb-2">Solución Aplicada</h4>
                                    <p className="text-green-700">{workOrder.solution_notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Execution Actions */}
                    {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-6">
                                {!isCompleting ? (
                                    <div className="flex gap-4">
                                        {workOrder.status === 'pending' || workOrder.status === 'approved' ? (
                                            <Button onClick={handleStartWork} size="lg" className="w-full">
                                                <Play className="mr-2 h-5 w-5" />
                                                Iniciar Trabajo
                                            </Button>
                                        ) : (
                                            <Button onClick={() => setIsCompleting(true)} size="lg" className="w-full bg-green-600 hover:bg-green-700">
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                Finalizar Trabajo
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <WorkOrderClosingForm
                                        workOrderId={workOrder.id}
                                        onComplete={() => {
                                            setIsCompleting(false)
                                            // Refresh order data
                                            const fetchOrder = async () => {
                                                const { data } = await supabase
                                                    .from('work_orders')
                                                    .select('*, assets(*)')
                                                    .eq('id', id)
                                                    .single()
                                                if (data) setWorkOrder(data)
                                            }
                                            fetchOrder()
                                        }}
                                        onCancel={() => setIsCompleting(false)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Asset Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                                    {asset?.image_url && <img src={asset.image_url} alt="" className="h-full w-full object-cover" />}
                                </div>
                                <div>
                                    <Link href={`/assets/${asset?.id}`} className="font-semibold hover:underline">
                                        {asset?.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">{asset?.location}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Información</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>Asignado a:</span>
                                </div>
                                <span className="font-medium">{workOrder.assigned_to || 'Sin asignar'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Creada:</span>
                                </div>
                                <span className="font-medium">{new Date(workOrder.created_at!).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    <span>Prioridad:</span>
                                </div>
                                <Badge variant={workOrder.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {workOrder.priority?.toUpperCase()}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
