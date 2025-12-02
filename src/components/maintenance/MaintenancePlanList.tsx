'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { TaskFormDialog, TaskFormValues } from './TaskFormDialog'
import { useToast } from '@/components/ui/use-toast'

interface Task {
    id: number
    asset_id: number
    component: string
    task: string
    frequency: 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual'
}

interface MaintenancePlanListProps {
    assetId: number
}

export function MaintenancePlanList({ assetId }: MaintenancePlanListProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('maintenance_task_definitions' as any)
                .select('*')
                .eq('asset_id', assetId)
                .order('id', { ascending: true })

            if (error) throw error
            if (data) setTasks(data as Task[])
        } catch (error) {
            console.error('Error fetching tasks:', error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las tareas de mantenimiento.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [assetId])

    const handleCreate = async (values: TaskFormValues) => {
        setIsSubmitting(true)
        try {
            const { error } = await (supabase
                .from('maintenance_task_definitions') as any)
                .insert([{ ...values, asset_id: assetId }])

            if (error) throw error

            toast({
                title: "Tarea creada",
                description: "La tarea se ha agregado al plan de mantenimiento.",
            })
            setIsDialogOpen(false)
            fetchTasks()
        } catch (error) {
            console.error('Error creating task:', error)
            toast({
                title: "Error",
                description: "No se pudo crear la tarea.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (values: TaskFormValues) => {
        if (!editingTask) return

        setIsSubmitting(true)
        try {
            const { error } = await (supabase
                .from('maintenance_task_definitions') as any)
                .update(values)
                .eq('id', editingTask.id)

            if (error) throw error

            toast({
                title: "Tarea actualizada",
                description: "Los cambios se han guardado correctamente.",
            })
            setIsDialogOpen(false)
            setEditingTask(null)
            fetchTasks()
        } catch (error) {
            console.error('Error updating task:', error)
            toast({
                title: "Error",
                description: "No se pudo actualizar la tarea.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta tarea?')) return

        try {
            const { error } = await supabase
                .from('maintenance_task_definitions' as any)
                .delete()
                .eq('id', id)

            if (error) throw error

            toast({
                title: "Tarea eliminada",
                description: "La tarea ha sido removida del plan.",
            })
            fetchTasks()
        } catch (error) {
            console.error('Error deleting task:', error)
            toast({
                title: "Error",
                description: "No se pudo eliminar la tarea.",
                variant: "destructive",
            })
        }
    }

    const openCreateDialog = () => {
        setEditingTask(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (task: Task) => {
        setEditingTask(task)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Plan de Mantenimiento</h3>
                <Button onClick={openCreateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Componente</TableHead>
                            <TableHead>Tarea / Acción</TableHead>
                            <TableHead>Frecuencia</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay tareas definidas para este activo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.component}</TableCell>
                                    <TableCell>{task.task}</TableCell>
                                    <TableCell className="capitalize">{task.frequency}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(task)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <TaskFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingTask}
                onSubmit={editingTask ? handleUpdate : handleCreate}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}
