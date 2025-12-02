'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Wrench,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Calendar,
    DollarSign,
    User
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Intervention {
    id: number
    title: string
    type: 'preventive' | 'corrective'
    status: string
    created_at: string
    completed_at: string | null
    downtime_hours: number
    labor_hours: number
    parts_cost: number
    labor_cost: number
    solution_notes: string | null
    operators: {
        full_name: string
    } | null
}

interface InterventionHistoryProps {
    assetId: number
}

export function InterventionHistory({ assetId }: InterventionHistoryProps) {
    const [interventions, setInterventions] = useState<Intervention[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data, error } = await supabase
                    .from('work_orders')
                    .select(`
                        *,
                        operators (full_name)
                    `)
                    .eq('asset_id', assetId)
                    .in('status', ['completed', 'in_progress'])
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (data) setInterventions(data)
            } catch (error) {
                console.error('Error fetching intervention history:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistory()
    }, [assetId])

    if (isLoading) {
        return <div className="p-4 text-center text-muted-foreground">Cargando historial...</div>
    }

    if (interventions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Historial de Intervenciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No hay intervenciones registradas para este activo.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial de Intervenciones
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Operador</TableHead>
                            <TableHead>Duración</TableHead>
                            <TableHead>Costo Total</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {interventions.map((intervention) => {
                            const totalCost = (intervention.parts_cost || 0) + (intervention.labor_cost || 0)
                            const date = new Date(intervention.created_at)

                            return (
                                <TableRow key={intervention.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{format(date, 'dd MMM yyyy', { locale: es })}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(date, 'HH:mm')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={intervention.type === 'preventive' ? 'outline' : 'destructive'} className="capitalize">
                                            {intervention.type === 'preventive' ? 'Preventivo' : 'Correctivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[250px]">
                                            <p className="font-medium truncate">{intervention.title}</p>
                                            {intervention.solution_notes && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    Solución: {intervention.solution_notes}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {intervention.operators?.full_name ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <User className="h-3 w-3" />
                                                {intervention.operators.full_name}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>Labor: {intervention.labor_hours || 0}h</span>
                                            {intervention.downtime_hours > 0 && (
                                                <span className="text-xs text-red-500 font-medium">
                                                    Down: {intervention.downtime_hours}h
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-green-600">
                                            ${totalCost.toFixed(2)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {intervention.status === 'completed' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                Completada
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                En Progreso
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
