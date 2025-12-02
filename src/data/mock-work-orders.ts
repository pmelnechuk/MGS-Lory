import { Database } from '@/types/supabase'

type WorkOrder = Database['public']['Tables']['work_orders']['Row']

export const MOCK_WORK_ORDERS: WorkOrder[] = [
    {
        id: 101,
        asset_id: 3,
        title: 'Falla en freno de giro',
        description: 'El puente grúa no frena correctamente al girar a la izquierda.',
        type: 'correctivo',
        priority: 'high',
        status: 'pending',
        reported_by: 'user-1',
        assigned_to: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        started_at: null,
        completed_at: null,
        is_machine_down: false,
        solution_notes: null
    },
    {
        id: 102,
        asset_id: 1,
        title: 'Fuga de aceite en compresor',
        description: 'Se detectó mancha de aceite debajo del equipo.',
        type: 'correctivo',
        priority: 'medium',
        status: 'in_progress',
        reported_by: 'user-2',
        assigned_to: 'tech-1',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        started_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        completed_at: null,
        is_machine_down: false,
        solution_notes: null
    },
    {
        id: 103,
        asset_id: 5,
        title: 'Mantenimiento Preventivo Mensual',
        description: 'Limpieza general y lubricación de guías.',
        type: 'preventivo',
        priority: 'medium',
        status: 'completed',
        reported_by: 'system',
        assigned_to: 'tech-2',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
        is_machine_down: true,
        solution_notes: 'Se realizó limpieza completa. Niveles de aceite ok.'
    }
]
