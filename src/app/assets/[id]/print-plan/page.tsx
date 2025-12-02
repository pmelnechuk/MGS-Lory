'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { MaintenancePlanPDF } from '@/components/maintenance/MaintenancePlanPDF'
import dynamic from 'next/dynamic'

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => <p>Cargando visor de PDF...</p>,
    }
)

export default function PrintPlanPage() {
    const params = useParams()
    const id = params.id as string
    const [asset, setAsset] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // Fetch Asset
            const { data: assetData, error: assetError } = await supabase
                .from('assets')
                .select('*')
                .eq('id', id)
                .single()

            if (assetError) {
                console.error('Error fetching asset:', assetError)
                return
            }
            setAsset(assetData)

            // Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('maintenance_task_definitions')
                .select('*')
                .eq('asset_id', id)
                .order('component')

            if (tasksError) {
                console.error('Error fetching tasks:', tasksError)
            } else {
                setTasks(tasksData || [])
            }

            setLoading(false)
        }

        if (id) {
            fetchData()
        }
    }, [id])

    if (loading) return <div className="p-8">Cargando datos del plan...</div>
    if (!asset) return <div className="p-8">Activo no encontrado</div>

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    return (
        <div className="h-screen w-full flex flex-col">
            <div className="p-4 border-b bg-white flex justify-between items-center">
                <h1 className="text-xl font-bold">Vista Previa del Plan de Mantenimiento</h1>
                <div className="text-sm text-gray-500">
                    {asset.name} - {currentMonth}/{currentYear}
                </div>
            </div>
            <div className="flex-1 bg-gray-100 p-4">
                <PDFViewer style={{ width: '100%', height: '100%' }}>
                    <MaintenancePlanPDF
                        asset={asset}
                        tasks={tasks}
                        month={currentMonth}
                        year={currentYear}
                    />
                </PDFViewer>
            </div>
        </div>
    )
}
