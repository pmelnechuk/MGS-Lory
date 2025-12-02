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
    AlertTriangle,
    CheckCircle2,
    Clock,
    Wrench,
    ArrowRight,
    HardHat,
    LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { ReportFailureDialog } from '@/components/work-orders/ReportFailureDialog'
import { ScheduleMaintenanceDialog } from '@/components/work-orders/ScheduleMaintenanceDialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const PRIORITY_CONFIG = {
    low: { label: 'Baja', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    medium: { label: 'Media', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    critical: { label: 'CRÍTICA', color: 'bg-red-100 text-red-700 border-red-200 animate-pulse' },
}

const STATUS_CONFIG = {
    pending: { label: 'Pendiente', icon: Clock, color: 'text-slate-500' },
    approved: { label: 'Aprobada', icon: CheckCircle2, color: 'text-blue-500' },
    in_progress: { label: 'En Progreso', icon: Wrench, color: 'text-orange-500' },
    completed: { label: 'Completada', icon: CheckCircle2, color: 'text-green-500' },
    cancelled: { label: 'Cancelada', icon: AlertTriangle, color: 'text-red-500' },
}

export default function WorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<'all' | 'preventive' | 'corrective'>('all')
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('work_orders')
                    .select('*, assets(name, location), operators(full_name)')
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (data) setWorkOrders(data)
            } catch (error) {
                console.error('Error fetching work orders:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrders()

        const channel = supabase
            .channel('work-orders-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => {
                fetchOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const filteredOrders = workOrders.filter(wo => {
        const assetName = wo.assets?.name || ''
        const matchesSearch = wo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assetName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter ? wo.status === statusFilter : true
        const matchesType = typeFilter === 'all' ? true : wo.type === typeFilter
        const matchesPriority = priorityFilter ? wo.priority === priorityFilter : true
        return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    const exportToPDF = () => {
        const doc = new jsPDF()

        doc.text('Reporte de Órdenes de Trabajo', 14, 15)
        doc.setFontSize(10)
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 22)

        const tableData = filteredOrders.map(wo => [
            wo.id,
            wo.title,
            wo.type,
            wo.priority,
            wo.status,
            wo.assets?.name || 'N/A',
            new Date(wo.created_at).toLocaleDateString()
        ])

        autoTable(doc, {
            head: [['ID', 'Título', 'Tipo', 'Prioridad', 'Estado', 'Activo', 'Fecha']],
            body: tableData,
            startY: 30,
        })

        doc.save('ordenes_trabajo.pdf')
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Cargando órdenes...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
                    <p className="text-muted-foreground">Gestión de tareas correctivas y preventivas.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/work-orders/kanban">
                        <Button variant="outline">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Vista Kanban
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={exportToPDF}>
                        Exportar PDF
                    </Button>
                    <ScheduleMaintenanceDialog />
                    <ReportFailureDialog />
                </div>
            </div>





            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por título o activo..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {/* Type Filter */}
                        <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Tipos</SelectItem>
                                <SelectItem value="preventive">Preventivas</SelectItem>
                                <SelectItem value="corrective">Correctivas</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Estados</SelectItem>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select value={priorityFilter || "all"} onValueChange={(value) => setPriorityFilter(value === "all" ? null : value)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Prioridades</SelectItem>
                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredOrders.map((wo) => {
                    const asset = wo.assets
                    const StatusIcon = STATUS_CONFIG[wo.status as keyof typeof STATUS_CONFIG]?.icon || Clock
                    const isCorrective = wo.type === 'corrective'

                    return (
                        <Link key={wo.id} href={`/work-orders/${wo.id}`}>
                            <Card className={cn(
                                "hover:shadow-md transition-shadow cursor-pointer group border-l-4",
                                isCorrective ? "border-l-red-500 bg-red-50/10" : "border-l-blue-500 bg-blue-50/10"
                            )}>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn(
                                                    PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color
                                                )}>
                                                    {PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.label}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">#{wo.id}</span>
                                                <Badge variant="secondary" className={cn(
                                                    "text-xs font-normal",
                                                    isCorrective ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {wo.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                                                </Badge>
                                            </div>
                                            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                                {wo.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {asset?.name} - {asset?.location}
                                            </p>
                                            {wo.operators && (
                                                <div className="flex items-center gap-1 text-sm text-blue-600">
                                                    <HardHat className="h-3 w-3" />
                                                    <span>{wo.operators.full_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col md:items-end justify-between gap-4">
                                            <div className={cn(
                                                "flex items-center gap-2 text-sm font-medium",
                                                STATUS_CONFIG[wo.status as keyof typeof STATUS_CONFIG]?.color
                                            )}>
                                                <StatusIcon className="h-4 w-4" />
                                                {STATUS_CONFIG[wo.status as keyof typeof STATUS_CONFIG]?.label}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>Creada: {new Date(wo.created_at!).toLocaleDateString()}</span>
                                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
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
