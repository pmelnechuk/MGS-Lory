'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
    component: z.string().min(2, 'El componente debe tener al menos 2 caracteres'),
    task: z.string().min(5, 'La tarea debe tener al menos 5 caracteres'),
    frequency: z.enum(['diario', 'semanal', 'mensual', 'trimestral', 'semestral', 'anual']),
})

export type TaskFormValues = z.infer<typeof formSchema>

interface TaskFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TaskFormValues | null
    onSubmit: (values: TaskFormValues) => Promise<void>
    isSubmitting: boolean
}

export function TaskFormDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
    isSubmitting
}: TaskFormDialogProps) {
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            component: '',
            task: '',
            frequency: 'diario',
        },
    })

    useEffect(() => {
        if (open) {
            form.reset(initialData || {
                component: '',
                task: '',
                frequency: 'diario',
            })
        }
    }, [open, initialData, form])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
                    <DialogDescription>
                        Define la acción de mantenimiento preventivo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="component"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Componente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Motor, Bancada, Tablero" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="task"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tarea / Acción</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Verificar nivel de aceite" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="frequency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frecuencia</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona frecuencia" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="diario">Diario</SelectItem>
                                            <SelectItem value="semanal">Semanal</SelectItem>
                                            <SelectItem value="mensual">Mensual</SelectItem>
                                            <SelectItem value="trimestral">Trimestral</SelectItem>
                                            <SelectItem value="semestral">Semestral</SelectItem>
                                            <SelectItem value="anual">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
