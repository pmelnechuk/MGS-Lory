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
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createOperator, deleteOperator } from './actions'
import { cn } from '@/lib/utils'

export default function OperatorsPage() {
    const [operators, setOperators] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const fetchOperators = async () => {
        try {
            const { data, error } = await supabase
                .from('operators')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setOperators(data)
        } catch (error) {
            console.error('Error fetching operators:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOperators()

        const channel = supabase
            .channel('operators-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'operators' }, () => {
                fetchOperators()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleCreate = async (formData: FormData) => {
        await createOperator(formData)
        setIsDialogOpen(false)
        fetchOperators()
    }

    const handleDelete = async (id: number) => {
        if (confirm('¿Estás seguro de eliminar este operario?')) {
            await deleteOperator(id)
            fetchOperators()
        }
    }

    const filteredOperators = operators.filter(op => {
        const matchesSearch = (op.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (op.dni?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (op.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'active' ? op.is_active : !op.is_active

        return matchesSearch && matchesStatus
    })

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Operarios</h1>
                    <p className="text-muted-foreground">Administración de personal técnico.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Operario
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Nuevo Operario</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nombre Completo</Label>
                                <Input id="full_name" name="full_name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dni">DNI</Label>
                                <Input id="dni" name="dni" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" name="phone" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialty">Especialidad</Label>
                                <Input id="specialty" name="specialty" placeholder="Ej: Tornero, Electricista" />
                            </div>
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Guardar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, DNI o especialidad..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="inactive">Inactivos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Especialidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredOperators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No se encontraron operarios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOperators.map((operator) => (
                                <TableRow key={operator.id}>
                                    <TableCell className="font-medium">{operator.full_name}</TableCell>
                                    <TableCell>{operator.dni}</TableCell>
                                    <TableCell>{operator.phone || '-'}</TableCell>
                                    <TableCell>{operator.specialty || '-'}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-medium",
                                            operator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        )}>
                                            {operator.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(operator.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
