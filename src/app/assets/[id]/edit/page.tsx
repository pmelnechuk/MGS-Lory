'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AssetForm } from '@/components/assets/AssetForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function EditAssetPage() {
    const router = useRouter()
    const params = useParams()
    const id = Number(params.id)
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
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
                toast({
                    title: "Error",
                    description: "No se pudo cargar el activo.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        if (id) fetchAsset()
    }, [id, toast])

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('assets')
                .update(data)
                .eq('id', id)

            if (error) throw error

            toast({
                title: "Activo actualizado",
                description: "Los cambios se han guardado correctamente.",
            })

            router.push(`/assets/${id}`)
            router.refresh()
        } catch (error) {
            console.error('Error updating asset:', error)
            toast({
                title: "Error",
                description: "No se pudo actualizar el activo.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-96">Cargando activo...</div>
    }

    if (!asset) {
        return <div>Activo no encontrado</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/assets/${id}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Editar Activo</h1>
                    <p className="text-muted-foreground">Modificar información del activo.</p>
                </div>
            </div>

            <AssetForm initialData={asset} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    )
}
