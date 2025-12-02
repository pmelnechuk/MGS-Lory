'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AssetForm } from '@/components/assets/AssetForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function NewAssetPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('assets')
                .insert([data])
                .select()

            if (error) throw error

            toast({
                title: "Activo creado",
                description: "El activo se ha registrado correctamente.",
            })

            router.push('/assets')
            router.refresh()
        } catch (error) {
            console.error('Error creating asset:', error)
            toast({
                title: "Error",
                description: "No se pudo crear el activo. Por favor intente nuevamente.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/assets">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nuevo Activo</h1>
                    <p className="text-muted-foreground">Registrar un nuevo equipo o maquinaria en el sistema.</p>
                </div>
            </div>

            <AssetForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
    )
}
