'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload, FileText, Trash } from 'lucide-react'
import Link from 'next/link'
import { pdf } from '@react-pdf/renderer'
import { MaintenancePlanPDF } from '@/components/maintenance/MaintenancePlanPDF'
import { ImageUpload } from '@/components/ui/image-upload'
import { cn } from "@/lib/utils"
interface TaskDefinition {
    id: number
    task: string
    frequency: string
    component: string
}

interface TaskCount {
    task_def_id: number
    performed_count: number
    possible_count: number
}

export default function MaintenanceClosingPage() {
    const params = useParams()
    const router = useRouter()
    const assetId = Number(params.id)

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [asset, setAsset] = useState<any>(null)
    const [tasks, setTasks] = useState<TaskDefinition[]>([])

    // Form State
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
    const [workingDays, setWorkingDays] = useState<number>(22)
    const [observations, setObservations] = useState('')
    const [taskCounts, setTaskCounts] = useState<Record<number, TaskCount>>({})

    // Upload State
    const [scanUrl, setScanUrl] = useState<string | null>(null)
    const [existingSheetId, setExistingSheetId] = useState<number | null>(null)

    // Load Asset and Tasks
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Asset
                const { data: assetData } = await supabase
                    .from('assets' as any)
                    .select('*')
                    .eq('id', assetId)
                    .single()
                setAsset(assetData)

                // 2. Tasks
                const { data: tasksData } = await supabase
                    .from('maintenance_task_definitions' as any)
                    .select('*')
                    .eq('asset_id', assetId)
                    .order('frequency')
                    .order('component')
                    .returns<TaskDefinition[]>()

                if (tasksData) {
                    setTasks(tasksData)
                    // Initialize counts
                    const initialCounts: Record<number, TaskCount> = {}
                        ; (tasksData as any[]).forEach(t => {
                            initialCounts[t.id] = {
                                task_def_id: t.id,
                                performed_count: 0,
                                possible_count: 0 // Default could be calculated based on frequency, but 0 for now
                            }
                        })
                    setTaskCounts(initialCounts)
                }
            } catch (error) {
                console.error('Error loading data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        if (assetId) loadData()
    }, [assetId])

    // Load Existing Sheet when Month/Year changes
    useEffect(() => {
        const loadSheet = async () => {
            if (!assetId) return

            const { data: sheet } = await supabase
                .from('monthly_maintenance_sheets' as any)
                .select('*, monthly_task_counts(*)')
                .eq('asset_id', assetId)
                .eq('month', parseInt(selectedMonth))
                .eq('year', parseInt(selectedYear))
                .single()

            if (sheet) {
                setExistingSheetId(sheet.id)
                setWorkingDays(sheet.working_days || 22)
                setObservations(sheet.observations || '')
                setScanUrl(sheet.scan_url)

                // Load counts
                if (sheet.monthly_task_counts) {
                    const counts: Record<number, TaskCount> = {}
                    sheet.monthly_task_counts.forEach((c: any) => {
                        counts[c.task_def_id] = {
                            task_def_id: c.task_def_id,
                            performed_count: c.performed_count,
                            possible_count: c.possible_count
                        }
                    })
                    // Merge with existing tasks to ensure all are present
                    setTaskCounts(prev => ({ ...prev, ...counts }))
                }
            } else {
                setExistingSheetId(null)
                setWorkingDays(22)
                setObservations('')
                setScanUrl(null)
                // Reset counts but keep structure
                setTaskCounts(prev => {
                    const reset: Record<number, TaskCount> = {}
                    Object.keys(prev).forEach(k => {
                        reset[Number(k)] = { ...prev[Number(k)], performed_count: 0, possible_count: 0 }
                    })
                    return reset
                })
            }
        }
        loadSheet()
    }, [assetId, selectedMonth, selectedYear])

    const handleCountChange = (taskId: number, field: 'performed_count' | 'possible_count', value: string) => {
        const numValue = parseInt(value) || 0
        setTaskCounts(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: numValue
            }
        }))
    }

    const handleExportPDF = async () => {
        if (!asset) return

        const pdfTasks = tasks.map(t => ({
            id: t.id,
            component: t.component,
            task: t.task,
            frequency: t.frequency
        }))

        try {
            const blob = await pdf(
                <MaintenancePlanPDF
                    asset={asset}
                    tasks={pdfTasks}
                    month={parseInt(selectedMonth)}
                    year={parseInt(selectedYear)}
                    workingDays={workingDays}
                />
            ).toBlob()

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Planilla-${asset.name}-${selectedMonth}-${selectedYear}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error al generar el PDF')
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Upsert Sheet
            const sheetData = {
                asset_id: assetId,
                month: parseInt(selectedMonth),
                year: parseInt(selectedYear),
                scan_url: scanUrl,
                working_days: workingDays,
                observations: observations,
                status: 'verified'
            }

            let sheetId = existingSheetId

            if (existingSheetId) {
                const { error } = await (supabase
                    .from('monthly_maintenance_sheets' as any) as any)
                    .update(sheetData)
                    .eq('id', existingSheetId)
                if (error) throw error
            } else {
                const { data, error } = await (supabase
                    .from('monthly_maintenance_sheets' as any) as any)
                    .insert(sheetData)
                    .select()
                    .single()
                if (error) throw error
                sheetId = data.id
            }

            // 3. Upsert Counts
            if (sheetId) {
                const countsToUpsert = Object.values(taskCounts).map(c => ({
                    sheet_id: sheetId,
                    task_def_id: c.task_def_id,
                    performed_count: c.performed_count,
                    possible_count: c.possible_count
                }))

                // Delete existing counts first to avoid conflicts or handle upsert properly
                // Since we have a unique constraint, upsert should work if we include ID, but we don't have ID for all.
                // Simplest is delete all for this sheet and insert.

                await supabase.from('monthly_task_counts' as any).delete().eq('sheet_id', sheetId)

                const { error: countsError } = await (supabase
                    .from('monthly_task_counts' as any) as any)
                    .insert(countsToUpsert)

                if (countsError) throw countsError
            }

            alert('Cierre mensual guardado exitosamente')
            router.refresh()

        } catch (error: any) {
            console.error('Error saving:', error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-8">Cargando...</div>
    if (!asset) return <div className="p-8">Activo no encontrado</div>

    // Group tasks by frequency
    const tasksByFreq = tasks.reduce((acc, task) => {
        if (!acc[task.frequency]) acc[task.frequency] = []
        acc[task.frequency].push(task)
        return acc
    }, {} as Record<string, TaskDefinition[]>)

    // Calculate Metrics
    const calculateMetrics = () => {
        let totalPerformed = 0
        let totalPossible = 0
        const byFreq: Record<string, { performed: number; possible: number }> = {}

        tasks.forEach(task => {
            const count = taskCounts[task.id]
            if (count) {
                const performed = count.performed_count || 0
                const possible = count.possible_count || 0

                totalPerformed += performed
                totalPossible += possible

                if (!byFreq[task.frequency]) {
                    byFreq[task.frequency] = { performed: 0, possible: 0 }
                }
                byFreq[task.frequency].performed += performed
                byFreq[task.frequency].possible += possible
            }
        })

        const globalCompliance = totalPossible > 0 ? (totalPerformed / totalPossible) * 100 : 0

        return {
            globalCompliance,
            byFreq
        }
    }

    const metrics = calculateMetrics()

    const getComplianceColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600 bg-green-100 border-green-200'
        if (percentage >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
        return 'text-red-600 bg-red-100 border-red-200'
    }

    // Validation
    const hasErrors = Object.values(taskCounts).some(c => c.performed_count > c.possible_count)
    const hasNegativeErrors = Object.values(taskCounts).some(c => c.performed_count < 0 || c.possible_count < 0)

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/assets/${assetId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cierre Mensual de Mantenimiento</h1>
                    <p className="text-muted-foreground">{asset.name} - {asset.model}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={handleExportPDF}>
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar Planilla
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || hasErrors || hasNegativeErrors}
                        className={cn("bg-blue-600 hover:bg-blue-700", (hasErrors || hasNegativeErrors) && "opacity-50 cursor-not-allowed")}
                    >
                        {isSaving ? 'Guardando...' : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cierre
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Metrics Scorecard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Cumplimiento Global
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline space-x-2">
                            <span className={`text-3xl font-bold px-2 py-1 rounded-md border ${getComplianceColor(metrics.globalCompliance)}`}>
                                {metrics.globalCompliance.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            PMP Total del Mes
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Cumplimiento por Frecuencia
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {Object.entries(metrics.byFreq).map(([freq, data]) => {
                                const percentage = data.possible > 0 ? (data.performed / data.possible) * 100 : 0
                                return (
                                    <div key={freq} className="space-y-1">
                                        <p className="text-xs font-medium uppercase text-muted-foreground">{freq}</p>
                                        <div className={`text-lg font-bold px-2 py-0.5 rounded border w-fit ${getComplianceColor(percentage)}`}>
                                            {percentage.toFixed(0)}%
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {data.performed}/{data.possible} tareas
                                        </p>
                                    </div>
                                )
                            })}
                            {Object.keys(metrics.byFreq).length === 0 && (
                                <p className="text-sm text-muted-foreground col-span-full">
                                    No hay datos calculados aún.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration & Upload */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Período y Datos Generales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mes</Label>
                                    <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <SelectItem key={m} value={String(m)}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Año</Label>
                                    <Input
                                        type="number"
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Días Laborales</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={workingDays}
                                    onChange={e => setWorkingDays(Math.max(0, parseInt(e.target.value) || 0))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Digitalización</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ImageUpload
                                value={scanUrl}
                                onChange={(url) => setScanUrl(url)}
                                onRemove={() => setScanUrl(null)}
                                bucket="app-images"
                                folder="maintenance-sheets"
                                className="w-full h-[600px]"
                            />
                            {scanUrl && (
                                <Button variant="outline" className="w-full" asChild>
                                    <a href={scanUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        Ver Imagen Completa
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Task Counters */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registro de Tareas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {Object.entries(tasksByFreq).map(([freq, tasks]) => (
                                <div key={freq} className="space-y-3">
                                    <h3 className="font-semibold text-sm uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                                        Frecuencia: {freq}
                                    </h3>
                                    <div className="space-y-2">
                                        {tasks.map(task => {
                                            const count = taskCounts[task.id] || { performed_count: 0, possible_count: 0 }
                                            const isInvalid = count.performed_count > count.possible_count

                                            return (
                                                <div key={task.id} className={cn("flex items-center gap-4 p-2 border rounded-md hover:bg-slate-50 transition-colors", isInvalid && "border-red-300 bg-red-50")}>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{task.task}</p>
                                                        <p className="text-xs text-muted-foreground">{task.component}</p>
                                                        {isInvalid && (
                                                            <p className="text-[10px] text-red-600 font-medium mt-1">
                                                                Error: Realizados no puede ser mayor a Posibles
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24">
                                                            <Label className={cn("text-xs text-muted-foreground", isInvalid && "text-red-600")}>Realizados</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                className={cn("h-8", isInvalid && "border-red-500 focus-visible:ring-red-500")}
                                                                value={count.performed_count === 0 ? '' : count.performed_count}
                                                                onChange={e => handleCountChange(task.id, 'performed_count', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="text-slate-300">/</div>
                                                        <div className="w-24">
                                                            <Label className="text-xs text-muted-foreground">Posibles</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                className="h-8"
                                                                value={count.possible_count === 0 ? '' : count.possible_count}
                                                                onChange={e => handleCountChange(task.id, 'possible_count', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            {tasks.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay tareas de mantenimiento definidas para este activo.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Observaciones Generales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Comentarios sobre el mes, problemas recurrentes, sugerencias..."
                                className="min-h-[100px]"
                                value={observations}
                                onChange={e => setObservations(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
