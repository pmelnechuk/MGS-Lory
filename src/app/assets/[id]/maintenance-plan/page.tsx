import { createClient } from '@/utils/supabase/server'
import { MaintenancePlanEditor } from '@/components/maintenance/MaintenancePlanEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MaintenancePlanPage({ params }: PageProps) {
    const { id } = await params
    const assetId = parseInt(id)

    if (isNaN(assetId)) {
        return notFound()
    }

    const supabase = await createClient()
    const { data: asset, error } = await supabase
        .from('assets')
        .select('name, model, location')
        .eq('id', assetId)
        .single()

    if (error || !asset) {
        console.error('Error fetching asset:', error)
        return notFound()
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <Link href={`/assets/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Settings className="h-8 w-8 text-primary" />
                        Plan de Mantenimiento
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {asset.name} <span className="text-sm bg-muted px-2 py-1 rounded-md ml-2">{asset.model}</span>
                    </p>
                </div>
            </div>

            {/* Editor */}
            <MaintenancePlanEditor assetId={assetId} />
        </div>
    )
}
