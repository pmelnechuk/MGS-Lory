'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Search,
    Filter,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Wrench
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
    operational: { label: 'Operativo', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
    maintenance: { label: 'En Mantenimiento', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
    repair: { label: 'En Reparación', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Wrench },
    retired: { label: 'Retirado', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: XCircle },
}

const CRITICALITY_LABELS = ['Baja', 'Media', 'Alta', 'CRÍTICA']

export default function AssetsPage() {
    const [assets, setAssets] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [criticalityFilter, setCriticalityFilter] = useState<number | null>(null)

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const { data, error } = await supabase
                    .from('assets')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (data) setAssets(data)
            } catch (error) {
                console.error('Error fetching assets:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAssets()
    }, [])

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter ? asset.status === statusFilter : true
        const matchesCriticality = criticalityFilter !== null ? asset.criticality === criticalityFilter : true
        return matchesSearch && matchesStatus && matchesCriticality
    })

    if (isLoading) {
        return <div className="flex justify-center items-center h-64">Cargando activos...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activos</h1>
                    <p className="text-muted-foreground">Gestión y monitoreo de maquinaria y equipos.</p>
                </div>
                <Link
                    href="/assets/new"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Nuevo Activo
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o ubicación..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
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

                    {/* Criticality Filter */}
                    <Select value={criticalityFilter !== null ? criticalityFilter.toString() : "all"} onValueChange={(value) => setCriticalityFilter(value === "all" ? null : parseInt(value))}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Criticidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {CRITICALITY_LABELS.map((label, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => {
                    const config = STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.operational
                    const StatusIcon = config.icon

                    return (
                        <Link key={asset.id} href={`/assets/${asset.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group overflow-hidden border-l-4 border-l-transparent">
                                <div className="relative h-48 w-full bg-muted">
                                    {asset.image_url ? (
                                        <img
                                            src={asset.image_url}
                                            alt={asset.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            Sin Imagen
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={cn(
                                            "px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 shadow-sm backdrop-blur-md",
                                            config.color
                                        )}>
                                            <StatusIcon className="w-3 h-3" />
                                            {config.label}
                                        </span>
                                    </div>
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{asset.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">{asset.location}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {asset.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Modelo</span>
                                            <span className="text-sm font-bold text-foreground">
                                                {asset.model || 'N/A'}
                                            </span>
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
