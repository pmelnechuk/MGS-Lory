'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { TaskGrid, LogStatus, Task } from '@/components/maintenance/TaskGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Save, ArrowLeft, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Helper to get days in month
const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate()

interface Asset {
    id: number
    name: string
    model: string
}

export default function MaintenanceUploadPage() {
    const router = useRouter()
    const [step, setStep] = useState<'upload' | 'digitize' | 'saving'>('upload')

    // Form State
    const [assets, setAssets] = useState<Asset[]>([])
    const [selectedAssetId, setSelectedAssetId] = useState<string>('')
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Data State
    const [tasks, setTasks] = useState<Task[]>([])
    const [gridData, setGridData] = useState<Record<number, Record<number, LogStatus>>>({})
    const [zoom, setZoom] = useState(1)

    // Fetch Assets on Load
    useEffect(() => {
        const fetchAssets = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('assets').select('id, name, model').eq('status', 'operational')
            if (data) setAssets(data)
        }
        fetchAssets()
    }, [])

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0]
            setFile(f)
            setPreviewUrl(URL.createObjectURL(f))
        }
    }

    // Stage A -> B Transition
    const handleStartDigitization = async () => {
        if (!selectedAssetId || !file) return

        // Fetch tasks for the asset
        const supabase = createClient()
        const { data: tasksData } = await supabase
            .from('maintenance_task_definitions')
            .select('*')
            .eq('asset_id', selectedAssetId)
            .order('component')

        if (tasksData) {
            setTasks(tasksData)
            setStep('digitize')
        }
    }

    // Stage C: Save Data
    const handleSave = async () => {
        setStep('saving')
        const supabase = createClient()

        try {
            // 1. Upload Image
            const fileExt = file!.name.split('.').pop()
            const fileName = `${selectedAssetId}/${selectedYear}-${selectedMonth}-${Math.random()}.${fileExt}`
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('maintenance-sheets')
                .upload(fileName, file!)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('maintenance-sheets')
                .getPublicUrl(fileName)

            // 2. Create Sheet Record
            const { data: sheetData, error: sheetError } = await supabase
                .from('monthly_maintenance_sheets')
                .insert({
                    asset_id: Number(selectedAssetId),
                    month: Number(selectedMonth),
                    year: Number(selectedYear),
                    scan_url: publicUrl,
                    status: 'verified', // Assuming direct verification for now
                    // performed_by: user.id // TODO: Get current user
                })
                .select()
                .single()

            if (sheetError) throw sheetError

            // 3. Prepare Logs
            const logsToInsert: any[] = []
            const daysInMonth = getDaysInMonth(Number(selectedMonth), Number(selectedYear))

            tasks.forEach(task => {
                for (let day = 1; day <= daysInMonth; day++) {
                    const status = gridData[task.id]?.[day] || 'completed'

                    logsToInsert.push({
                        sheet_id: sheetData.id,
                        task_def_id: task.id,
                        log_date: `${selectedYear}-${selectedMonth.padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                        status: status
                    })
                }
            })

            // 4. Bulk Insert Logs
            const { error: logsError } = await supabase
                .from('daily_maintenance_logs')
                .insert(logsToInsert)

            if (logsError) throw logsError

            alert('Planilla guardada exitosamente!')
            router.push('/dashboard') // Or wherever

        } catch (error: any) {
            console.error('Error saving:', error)
            alert('Error al guardar: ' + error.message)
            setStep('digitize')
        }
    }

    if (step === 'upload') {
        return (
            <div className="max-w-2xl mx-auto py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Cargar Planilla de Mantenimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Activo</Label>
                                <Select onValueChange={setSelectedAssetId} value={selectedAssetId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar activo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {assets.map(a => (
                                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
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
                        </div>

                        <div className="space-y-2">
                            <Label>Foto de la Planilla</Label>
                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                {previewUrl ? (
                                    <div className="relative h-48 w-full">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-muted-foreground">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <span>Arrastra una imagen o haz clic para seleccionar</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            disabled={!selectedAssetId || !file}
                            onClick={handleStartDigitization}
                        >
                            Comenzar Digitalización
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setStep('upload')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-bold text-lg">Digitalizando: {assets.find(a => String(a.id) === selectedAssetId)?.name}</h1>
                        <p className="text-sm text-muted-foreground">Período: {selectedMonth}/{selectedYear}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={step === 'saving'}>
                    {step === 'saving' ? 'Guardando...' : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Planilla
                        </>
                    )}
                </Button>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Image Viewer */}
                <div className="w-1/2 bg-gray-900 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.min(z + 0.5, 3))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => setZoom(z => Math.max(z - 0.5, 1))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </div>
                    {previewUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={previewUrl}
                            alt="Sheet"
                            className="transition-transform duration-200 ease-out"
                            style={{ transform: `scale(${zoom})`, maxHeight: '100%', maxWidth: '100%' }}
                        />
                    )}
                </div>

                {/* Right: Grid */}
                <div className="w-1/2 bg-gray-50 p-4 overflow-auto">
                    <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-md text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div>
                            <strong>Modo Rápido:</strong> Todo inicia como "Completado" (Verde).
                            Haz clic en las celdas para marcar excepciones (Rojo: No hecho, Naranja: Falló).
                        </div>
                    </div>

                    <TaskGrid
                        tasks={tasks}
                        daysInMonth={getDaysInMonth(Number(selectedMonth), Number(selectedYear))}
                        onDataChange={setGridData}
                    />
                </div>
            </div>
        </div>
    )
}
