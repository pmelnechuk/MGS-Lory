export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'admin' | 'supervisor' | 'operario'
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: 'admin' | 'supervisor' | 'operario'
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: 'admin' | 'supervisor' | 'operario'
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            assets: {
                Row: {
                    id: number
                    name: string
                    description: string | null
                    criticality: number
                    status: 'operational' | 'maintenance' | 'broken' | 'inactive'
                    location: string | null
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    name: string
                    description?: string | null
                    criticality: number
                    status?: 'operational' | 'maintenance' | 'broken' | 'inactive'
                    location?: string | null
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    description?: string | null
                    criticality?: number
                    status?: 'operational' | 'maintenance' | 'broken' | 'inactive'
                    location?: string | null
                    image_url?: string | null
                    created_at?: string
                }
            }
            inventory_items: {
                Row: {
                    id: number
                    name: string
                    sku: string | null
                    description: string | null
                    current_stock: number
                    min_stock_alert: number
                    unit_cost: number | null
                    location_in_warehouse: string | null
                    updated_at: string
                }
                Insert: {
                    id?: number
                    name: string
                    sku?: string | null
                    description?: string | null
                    current_stock?: number
                    min_stock_alert?: number
                    unit_cost?: number | null
                    location_in_warehouse?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    sku?: string | null
                    description?: string | null
                    current_stock?: number
                    min_stock_alert?: number
                    unit_cost?: number | null
                    location_in_warehouse?: string | null
                    updated_at?: string
                }
            }
            maintenance_schedules: {
                Row: {
                    id: number
                    asset_id: number
                    title: string
                    frequency_days: number
                    last_generated_date: string | null
                    next_due_date: string
                    is_active: boolean | null
                }
                Insert: {
                    id?: number
                    asset_id: number
                    title: string
                    frequency_days: number
                    last_generated_date?: string | null
                    next_due_date: string
                    is_active?: boolean | null
                }
                Update: {
                    id?: number
                    asset_id?: number
                    title?: string
                    frequency_days?: number
                    last_generated_date?: string | null
                    next_due_date?: string
                    is_active?: boolean | null
                }
            }
            work_orders: {
                Row: {
                    id: number
                    asset_id: number
                    title: string | null
                    description: string | null
                    type: 'correctivo' | 'preventivo' | null
                    priority: 'low' | 'medium' | 'high' | 'emergency' | null
                    status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | null
                    reported_by: string | null
                    assigned_to: string | null
                    created_at: string | null
                    started_at: string | null
                    completed_at: string | null
                    is_machine_down: boolean | null
                    solution_notes: string | null
                }
                Insert: {
                    id?: number
                    asset_id: number
                    title?: string | null
                    description?: string | null
                    type?: 'correctivo' | 'preventivo' | null
                    priority?: 'low' | 'medium' | 'high' | 'emergency' | null
                    status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | null
                    reported_by?: string | null
                    assigned_to?: string | null
                    created_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    is_machine_down?: boolean | null
                    solution_notes?: string | null
                }
                Update: {
                    id?: number
                    asset_id?: number
                    title?: string | null
                    description?: string | null
                    type?: 'correctivo' | 'preventivo' | null
                    priority?: 'low' | 'medium' | 'high' | 'emergency' | null
                    status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | null
                    reported_by?: string | null
                    assigned_to?: string | null
                    created_at?: string | null
                    started_at?: string | null
                    completed_at?: string | null
                    is_machine_down?: boolean | null
                    solution_notes?: string | null
                }
            }
            work_order_items: {
                Row: {
                    id: number
                    work_order_id: number | null
                    item_id: number
                    quantity_used: number
                    cost_at_moment: number
                    created_at: string | null
                }
                Insert: {
                    id?: number
                    work_order_id?: number | null
                    item_id: number
                    quantity_used: number
                    cost_at_moment: number
                    created_at?: string | null
                }
                Update: {
                    id?: number
                    work_order_id?: number | null
                    item_id?: number
                    quantity_used?: number
                    cost_at_moment?: number
                    created_at?: string | null
                }
            }
            monthly_maintenance_sheets: {
                Row: {
                    id: number
                    asset_id: number
                    month: number
                    year: number
                    scan_url: string | null
                    working_days: number
                    observations: string | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    asset_id: number
                    month: number
                    year: number
                    scan_url?: string | null
                    working_days?: number
                    observations?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    asset_id?: number
                    month?: number
                    year?: number
                    scan_url?: string | null
                    working_days?: number
                    observations?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            monthly_task_counts: {
                Row: {
                    id: number
                    sheet_id: number
                    task_def_id: number
                    performed_count: number
                    possible_count: number
                    created_at: string
                }
                Insert: {
                    id?: number
                    sheet_id: number
                    task_def_id: number
                    performed_count: number
                    possible_count: number
                    created_at?: string
                }
                Update: {
                    id?: number
                    sheet_id?: number
                    task_def_id?: number
                    performed_count?: number
                    possible_count?: number
                    created_at?: string
                }
            }
            maintenance_task_definitions: {
                Row: {
                    id: number
                    asset_id: number
                    component: string
                    name: string
                    frequency: string
                    created_at: string
                }
                Insert: {
                    id?: number
                    asset_id: number
                    component: string
                    name: string
                    frequency: string
                    created_at?: string
                }
                Update: {
                    id?: number
                    asset_id?: number
                    component?: string
                    name?: string
                    frequency?: string
                    created_at?: string
                }
            }
        }
    }
}
