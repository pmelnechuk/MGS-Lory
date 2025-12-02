import { SupabaseClient } from '@supabase/supabase-js'

interface WorkOrder {
    id: number
    type: 'preventive' | 'corrective'
    status: string
    created_at: string
    started_at?: string
    completed_at?: string
    downtime_hours?: number
    labor_hours?: number
    labor_cost?: number
    parts_cost?: number
    asset_id?: number
}

interface InventoryMovement {
    id: number
    inventory_item_id: number
    movement_type: 'purchase' | 'consumption' | 'adjustment' | 'return'
    quantity: number
    created_at: string
}

interface InventoryItem {
    id: number
    name: string
    quantity: number
    min_quantity: number
    category: string
}

/**
 * Calcula el MTBF (Mean Time Between Failures) para un activo específico o global
 * @param workOrders - Array de work orders
 * @param assetId - ID del activo (opcional, si no se especifica calcula global)
 * @param periodDays - Período en días para el cálculo (default: 180 días / 6 meses)
 * @returns MTBF en horas o null si no hay suficientes datos
 */
export function calculateMTBF(
    workOrders: WorkOrder[],
    assetId?: number,
    periodDays: number = 180
): number | null {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    // Filtrar solo fallas correctivas completadas
    let failures = workOrders.filter(wo =>
        wo.type === 'corrective' &&
        wo.status === 'completed' &&
        wo.completed_at &&
        new Date(wo.completed_at) >= cutoffDate
    )

    if (assetId) {
        failures = failures.filter(wo => wo.asset_id === assetId)
    }

    if (failures.length < 2) return null

    // Ordenar por fecha de finalización
    failures.sort((a, b) =>
        new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
    )

    // Calcular tiempo total entre primera y última falla
    const firstFailure = new Date(failures[0].completed_at!)
    const lastFailure = new Date(failures[failures.length - 1].completed_at!)
    const totalHours = (lastFailure.getTime() - firstFailure.getTime()) / (1000 * 60 * 60)

    // MTBF = Total operating time / Number of failures
    const mtbf = totalHours / (failures.length - 1)

    return Math.round(mtbf * 10) / 10
}

/**
 * Calcula el MTTR (Mean Time To Repair) para un activo específico o global
 * @param workOrders - Array de work orders
 * @param assetId - ID del activo (opcional)
 * @param periodDays - Período en días para el cálculo
 * @returns MTTR en horas o null si no hay datos
 */
export function calculateMTTR(
    workOrders: WorkOrder[],
    assetId?: number,
    periodDays: number = 180
): number | null {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    let repairs = workOrders.filter(wo =>
        wo.status === 'completed' &&
        wo.completed_at &&
        new Date(wo.completed_at) >= cutoffDate
    )

    if (assetId) {
        repairs = repairs.filter(wo => wo.asset_id === assetId)
    }

    if (repairs.length === 0) return null

    // Calcular tiempo promedio de reparación
    // Priorizar downtime_hours ingresado manualmente, sino calcular diferencia de fechas
    const totalRepairTime = repairs.reduce((sum, wo) => {
        if (wo.downtime_hours && wo.downtime_hours > 0) {
            return sum + wo.downtime_hours
        }

        if (wo.started_at && wo.completed_at) {
            const start = new Date(wo.started_at).getTime()
            const end = new Date(wo.completed_at).getTime()
            const hours = (end - start) / (1000 * 60 * 60)
            return sum + Math.max(0, hours)
        }

        return sum
    }, 0)

    const mttr = totalRepairTime / repairs.length

    return Math.round(mttr * 10) / 10
}

/**
 * Calcula la disponibilidad del equipo basada en downtime
 * @param workOrders - Array de work orders
 * @param assetId - ID del activo (opcional)
 * @param periodDays - Período en días
 * @returns Porcentaje de disponibilidad (0-100) o null
 */
export function calculateAvailability(
    workOrders: WorkOrder[],
    assetId?: number,
    periodDays: number = 30
): number | null {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    let completedOrders = workOrders.filter(wo =>
        wo.status === 'completed' &&
        wo.completed_at &&
        new Date(wo.completed_at) >= cutoffDate
    )

    if (assetId) {
        completedOrders = completedOrders.filter(wo => wo.asset_id === assetId)
    }

    // Calcular total de downtime
    const totalDowntime = completedOrders.reduce((sum, wo) =>
        sum + (wo.downtime_hours || 0),
        0)

    // Horas totales del período
    const totalPeriodHours = periodDays * 24

    // Disponibilidad = (Tiempo operativo / Tiempo total) * 100
    const availability = ((totalPeriodHours - totalDowntime) / totalPeriodHours) * 100

    return Math.max(0, Math.min(100, Math.round(availability * 10) / 10))
}

/**
 * Obtiene tendencias de consumo de inventario
 * @param movements - Array de movimientos de inventario
 * @param itemId - ID del ítem (opcional)
 * @param periodDays - Período en días
 * @returns Array con datos agregados por mes
 */
export function getConsumptionTrend(
    movements: InventoryMovement[],
    itemId?: number,
    periodDays: number = 90
): { month: string; consumption: number; purchases: number }[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    let filteredMovements = movements.filter(m =>
        new Date(m.created_at) >= cutoffDate
    )

    if (itemId) {
        filteredMovements = filteredMovements.filter(m => m.inventory_item_id === itemId)
    }

    // Agrupar por mes
    const byMonth: Record<string, { consumption: number; purchases: number }> = {}

    filteredMovements.forEach(m => {
        const date = new Date(m.created_at)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        if (!byMonth[monthKey]) {
            byMonth[monthKey] = { consumption: 0, purchases: 0 }
        }

        if (m.movement_type === 'consumption') {
            byMonth[monthKey].consumption += Math.abs(m.quantity)
        } else if (m.movement_type === 'purchase') {
            byMonth[monthKey].purchases += m.quantity
        }
    })

    // Convertir a array y ordenar
    return Object.entries(byMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * Predice cuándo se agotará el stock basado en consumo promedio
 * @param item - Ítem de inventario
 * @param movements - Movimientos de inventario del ítem
 * @param lookbackDays - Días hacia atrás para calcular promedio
 * @returns Objeto con días estimados hasta stockout y cantidad sugerida
 */
export function predictStockout(
    item: InventoryItem,
    movements: InventoryMovement[],
    lookbackDays: number = 30
): {
    daysUntilStockout: number | null
    recommendedOrderQuantity: number
    avgDailyConsumption: number
} {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

    const consumptions = movements.filter(m =>
        m.inventory_item_id === item.id &&
        m.movement_type === 'consumption' &&
        new Date(m.created_at) >= cutoffDate
    )

    if (consumptions.length === 0) {
        return {
            daysUntilStockout: null,
            recommendedOrderQuantity: item.min_quantity * 2,
            avgDailyConsumption: 0
        }
    }

    // Calcular consumo total en el período
    const totalConsumption = consumptions.reduce((sum, m) =>
        sum + Math.abs(m.quantity),
        0)

    const avgDailyConsumption = totalConsumption / lookbackDays

    // Días hasta stockout
    const currentStock = item.quantity
    const daysUntilStockout = avgDailyConsumption > 0
        ? Math.floor(currentStock / avgDailyConsumption)
        : null

    // Cantidad recomendada: suficiente para 30 días + buffer del 20%
    const recommendedOrderQuantity = Math.ceil(avgDailyConsumption * 30 * 1.2)

    return {
        daysUntilStockout,
        recommendedOrderQuantity: Math.max(recommendedOrderQuantity, item.min_quantity),
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100
    }
}

/**
 * Calcula métricas agregadas de mantenimiento
 */
export function getMaintenanceMetrics(workOrders: WorkOrder[], periodDays: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - periodDays)

    const recentOrders = workOrders.filter(wo =>
        wo.created_at &&
        new Date(wo.created_at) >= cutoffDate
    )

    const completed = recentOrders.filter(wo => wo.status === 'completed')
    const preventive = completed.filter(wo => wo.type === 'preventive')
    const corrective = completed.filter(wo => wo.type === 'corrective')

    const totalCost = completed.reduce((sum, wo) =>
        sum + (wo.labor_cost || 0) + (wo.parts_cost || 0),
        0)

    return {
        totalWorkOrders: recentOrders.length,
        completed: completed.length,
        preventive: preventive.length,
        corrective: corrective.length,
        preventiveRate: recentOrders.length > 0
            ? Math.round((preventive.length / recentOrders.length) * 100)
            : 0,
        avgDowntime: completed.length > 0
            ? Math.round((completed.reduce((sum, wo) => sum + (wo.downtime_hours || 0), 0) / completed.length) * 10) / 10
            : 0,
        totalCost: Math.round(totalCost),
        mtbf: calculateMTBF(workOrders, undefined, periodDays),
        mttr: calculateMTTR(workOrders, undefined, periodDays),
        availability: calculateAvailability(workOrders, undefined, periodDays)
    }
}
