'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TaskFormDialog, TaskFormValues } from './TaskFormDialog'
// Actually, I haven't seen sonner installed. I'll use window.alert or just console for errors and simple UI feedback.
// Better yet, I'll stick to simple state feedback or standard alerts to avoid dependency issues unless I check.
// I'll check package.json for toast.

interface Task {
    id: number
    component: string
    task: string
    frequency: 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual'
    is_active: boolean
}

interface MaintenancePlanEditorProps {
    assetId: number
}

const FREQUENCY_COLORS = {
    diario: 'bg-slate-100 text-slate-800 border-slate-200',
    semanal: 'bg-blue-100 text-blue-800 border-blue-200',
    mensual: 'bg-green-100 text-green-800 border-green-200',
    trimestral: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    semestral: 'bg-orange-100 text-orange-800 border-orange-200',
    anual: 'bg-red-100 text-red-800 border-red-200',
}

export function MaintenancePlanEditor({ assetId }: MaintenancePlanEditorProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const supabase = createClient()

    const fetchTasks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('maintenance_task_definitions')
                .select('*')
                .eq('asset_id', assetId)
                .eq('is_active', true)
                .order('component', { ascending: true })
                .order('id', { ascending: true })

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setIsLoading(false)
        }
    }, [assetId, supabase])

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    const handleSave = async (values: TaskFormValues) => {
        setIsSubmitting(true)
        try {
            if (editingTask) {
                const { error } = await supabase
                    .from('maintenance_task_definitions')
                    .update({
                        component: values.component,
                        task: values.task,
                        frequency: values.frequency
                    })
                    .eq('id', editingTask.id)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('maintenance_task_definitions')
                    .insert({
                        asset_id: assetId,
                        component: values.component,
                        task: values.task,
                        frequency: values.frequency,
                        is_active: true
                    })

                if (error) throw error
            }

            await fetchTasks()
            setIsDialogOpen(false)
            setEditingTask(null)
        } catch (error) {
            console.error('Error saving task:', error)
            alert('Error al guardar la tarea')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const { error } = await supabase
                .from('maintenance_task_definitions')
                .update({ is_active: false })
                .eq('id', deleteId)

            if (error) throw error

            setTasks(tasks.filter(t => t.id !== deleteId))
            setDeleteId(null)
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('Error al eliminar la tarea')
        }
    }

    const openNewTask = () => {
        setEditingTask(null)
        setIsDialogOpen(true)
    }

    const openEditTask = (task: Task) => {
        setEditingTask(task)
        setIsDialogOpen(true)
    }

    // Group tasks by component
    const groupedTasks = tasks.reduce((acc, task) => {
        if (!acc[task.component]) {
            acc[task.component] = []
        }
        acc[task.component].push(task)
        return acc
    }, {} as Record<string, Task[]>)

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando plan de mantenimiento...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tareas de Mantenimiento</h2>
                <Button onClick={openNewTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Tarea
                </Button>
            </div>

            {Object.keys(groupedTasks).length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                        <p>No hay tareas definidas para este activo.</p>
                        <Button variant="link" onClick={openNewTask}>Crear la primera tarea</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedTasks).map(([component, componentTasks]) => (
                        <Card key={component} className="overflow-hidden">
                            <CardHeader className="bg-muted/40 py-3">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    {component}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {componentTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                                            <div className="flex-1 mr-4">
                                                <p className="font-medium text-sm">{task.task}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={FREQUENCY_COLORS[task.frequency]}>
                                                    {task.frequency}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTask(task)}>
                                                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(task.id)}>
                                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <TaskFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingTask}
                onSubmit={handleSave}
                isSubmitting={isSubmitting}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción ocultará la tarea del plan de mantenimiento actual. No se borrarán los registros históricos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
