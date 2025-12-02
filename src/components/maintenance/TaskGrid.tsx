'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, X, AlertTriangle, Minus } from 'lucide-react'

// Define the possible states for a log entry
export type LogStatus = 'completed' | 'missed' | 'failed' | 'n/a'

export interface Task {
    id: number
    component: string
    task: string
    frequency: string
}

interface TaskGridProps {
    tasks: Task[]
    daysInMonth: number
    onDataChange: (data: Record<number, Record<number, LogStatus>>) => void
}

export function TaskGrid({ tasks, daysInMonth, onDataChange }: TaskGridProps) {
    // State matrix: [taskId][day] -> status
    // We initialize everything as 'completed' (Happy Path)
    const [gridState, setGridState] = useState<Record<number, Record<number, LogStatus>>>({})

    // Initialize grid when tasks change
    useEffect(() => {
        const initialState: Record<number, Record<number, LogStatus>> = {}

        tasks.forEach(task => {
            initialState[task.id] = {}
            for (let day = 1; day <= daysInMonth; day++) {
                // Default logic:
                // If frequency is 'diario', default to 'completed'
                // For others, we might default to 'n/a' and let user toggle, 
                // but user requested "Happy Path" -> "completed".
                // However, for weekly tasks, it doesn't make sense to have 30 'completed'.
                // Let's stick to the requested "Happy Path" of 'completed' for now, 
                // or maybe 'n/a' for non-daily tasks on most days?
                // The user said: "Inicializa todos los estados como 'completed' (Verde / Check)."
                // So we will follow that instruction strictly.
                initialState[task.id][day] = 'completed'
            }
        })
        setGridState(initialState)
        onDataChange(initialState)
    }, [tasks, daysInMonth])

    const handleCellClick = (taskId: number, day: number) => {
        setGridState(prev => {
            const currentStatus = prev[taskId][day]
            let nextStatus: LogStatus = 'completed'

            // Cycle: completed -> missed -> failed -> n/a -> completed
            if (currentStatus === 'completed') nextStatus = 'missed'
            else if (currentStatus === 'missed') nextStatus = 'failed'
            else if (currentStatus === 'failed') nextStatus = 'n/a'
            else if (currentStatus === 'n/a') nextStatus = 'completed'

            const newState = {
                ...prev,
                [taskId]: {
                    ...prev[taskId],
                    [day]: nextStatus
                }
            }

            // Notify parent of change
            onDataChange(newState)
            return newState
        })
    }

    const getStatusColor = (status: LogStatus) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 hover:bg-green-200'
            case 'missed': return 'bg-red-100 text-red-700 hover:bg-red-200'
            case 'failed': return 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            case 'n/a': return 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            default: return 'bg-gray-50'
        }
    }

    const getStatusIcon = (status: LogStatus) => {
        switch (status) {
            case 'completed': return <Check className="w-3 h-3" />
            case 'missed': return <X className="w-3 h-3" />
            case 'failed': return <AlertTriangle className="w-3 h-3" />
            case 'n/a': return <Minus className="w-3 h-3" />
            default: return null
        }
    }

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return (
        <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 border-b border-r bg-gray-50 text-left w-32 sticky left-0 z-10">Componente</th>
                        <th className="p-2 border-b border-r bg-gray-50 text-left w-48 sticky left-32 z-10">Tarea</th>
                        <th className="p-2 border-b border-r bg-gray-50 text-center w-20">Frec.</th>
                        {days.map(day => (
                            <th key={day} className="p-1 border-b border-r bg-gray-50 min-w-[30px] text-center font-medium text-gray-500">
                                {day}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50/50">
                            <td className="p-2 border-b border-r font-medium sticky left-0 bg-white z-10 truncate max-w-[128px]" title={task.component}>
                                {task.component}
                            </td>
                            <td className="p-2 border-b border-r sticky left-32 bg-white z-10 truncate max-w-[192px]" title={task.task}>
                                {task.task}
                            </td>
                            <td className="p-2 border-b border-r text-center text-gray-500 text-[10px] uppercase">
                                {task.frequency.slice(0, 3)}
                            </td>
                            {days.map(day => {
                                const status = gridState[task.id]?.[day] || 'completed'
                                return (
                                    <td
                                        key={day}
                                        className="p-0 border-b border-r last:border-r-0"
                                    >
                                        <button
                                            onClick={() => handleCellClick(task.id, day)}
                                            className={cn(
                                                "w-full h-8 flex items-center justify-center transition-colors",
                                                getStatusColor(status)
                                            )}
                                            title={`Día ${day}: ${status}`}
                                        >
                                            {getStatusIcon(status)}
                                        </button>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
