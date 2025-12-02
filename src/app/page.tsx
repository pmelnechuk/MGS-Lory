'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Wrench,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts'
import { MaintenanceKPIs } from '@/components/dashboard/MaintenanceKPIs'
import { ReportFailureDialog } from '@/components/work-orders/ReportFailureDialog'

interface Asset {
  id: number
  status: string
}

interface WorkOrder {
  id: number
  status: string
  priority: string
  title: string
  created_at: string
}

interface InventoryItem {
  id: number
  quantity: number
  min_quantity: number
  name: string
  unit: string
  last_updated: string
}

interface ActivityItem {
  id: string
  type: 'work_order' | 'inventory'
  title: string
  description: string
  date: string
  icon: React.ElementType
  color: string
  bg: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    operationalAssets: 0,
    activeWorkOrders: 0,
    lowStockItems: 0,
    criticalAlerts: 0,
    maintenanceIssues: 0
  })
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Assets
        const { data: assetsData } = await supabase.from('assets').select('*')
        const assets = (assetsData || []) as Asset[]
        const totalAssets = assets.length
        const operationalAssets = assets.filter(a => a.status === 'operational').length
        const criticalAssets = assets.filter(a => a.status === 'broken').length

        // Fetch Work Orders
        const { data: workOrdersData } = await supabase.from('work_orders').select('*').order('created_at', { ascending: false })
        const workOrders = (workOrdersData || []) as WorkOrder[]
        const activeWorkOrders = workOrders.filter(wo => ['pending', 'in_progress', 'approved'].includes(wo.status)).length
        const emergencyOrders = workOrders.filter(wo => wo.priority === 'emergency' && wo.status !== 'completed').length

        // Fetch Inventory
        const { data: inventoryData } = await supabase.from('inventory_items').select('*').order('last_updated', { ascending: false })
        const inventory = (inventoryData || []) as InventoryItem[]
        const lowStockItems = inventory.filter(i => i.quantity <= i.min_quantity).length

        setStats({
          totalAssets,
          operationalAssets,
          activeWorkOrders,
          lowStockItems,
          criticalAlerts: criticalAssets + emergencyOrders,
          maintenanceIssues: 0
        })

        // Fetch Maintenance Issues (Current Month)
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { count: maintenanceIssues } = await supabase
          .from('daily_maintenance_logs')
          .select('*', { count: 'exact', head: true })
          .gte('log_date', firstDay)
          .in('status', ['missed', 'failed'])

        setStats(prev => ({ ...prev, maintenanceIssues: maintenanceIssues || 0 }))

        // Build Activity Feed
        const recentWorkOrders = workOrders.slice(0, 5).map(wo => ({
          id: `wo-${wo.id}`,
          type: 'work_order' as const,
          title: `Orden de Trabajo #${wo.id}`,
          description: wo.title,
          date: wo.created_at,
          icon: Wrench,
          color: 'text-blue-500',
          bg: 'bg-blue-100'
        }))

        const recentInventory = inventory.slice(0, 3).map(item => ({
          id: `inv-${item.id}`,
          type: 'inventory' as const,
          title: 'Actualización de Stock',
          description: `${item.name} - ${item.quantity} ${item.unit}`,
          date: item.last_updated,
          icon: Package,
          color: 'text-green-500',
          bg: 'bg-green-100'
        }))

        const feed = [...recentWorkOrders, ...recentInventory]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 6)

        setActivityFeed(feed)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Real-time subscriptions
    const channels = [
      supabase.channel('assets-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchData).subscribe(),
      supabase.channel('work-orders-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, fetchData).subscribe(),
      supabase.channel('inventory-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, fetchData).subscribe(),
      supabase.channel('maintenance-logs-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'daily_maintenance_logs' }, fetchData).subscribe()
    ]

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [])


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando dashboard...</div>
  }

  const { totalAssets, operationalAssets, activeWorkOrders, lowStockItems, criticalAlerts } = stats

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
          <p className="text-muted-foreground">Resumen de operaciones y estado de planta.</p>
        </div>
        <div className="flex gap-2">
          <ReportFailureDialog />
          <Link href="/work-orders">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Orden
            </Button>
          </Link>
        </div>
      </div>

      {/* Inventory Alerts - High Priority */}
      <InventoryAlerts />

      {/* KPI Grid - Operational Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Activos Totales</p>
              <h2 className="text-3xl font-bold">{totalAssets}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {operationalAssets} Operativos
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Link href="/work-orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">OTs Activas</p>
                <h2 className="text-3xl font-bold text-primary">{activeWorkOrders}</h2>
                <p className="text-xs text-primary/80 mt-1">
                  Pendientes y En Progreso
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Wrench className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory">
          <Card className={cn(
            "hover:shadow-md transition-shadow cursor-pointer border-l-4",
            lowStockItems > 0 ? "border-l-orange-500 bg-orange-50/30" : "border-l-secondary bg-secondary/20"
          )}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Bajo</p>
                <h2 className={cn("text-3xl font-bold", lowStockItems > 0 ? "text-orange-700" : "text-foreground")}>
                  {lowStockItems}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Artículos requieren reposición
                </p>
              </div>
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", lowStockItems > 0 ? "bg-orange-100 text-orange-600" : "bg-secondary text-secondary-foreground")}>
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className={cn(
          "hover:shadow-md transition-shadow border-l-4",
          criticalAlerts > 0 ? "border-l-destructive bg-destructive/5" : "border-l-muted"
        )}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Alertas Críticas</p>
              <h2 className={cn("text-3xl font-bold", criticalAlerts > 0 ? "text-destructive" : "text-muted-foreground")}>
                {criticalAlerts}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Equipos parados / Emergencias
              </p>
            </div>
            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", criticalAlerts > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div >

      {/* Advanced Analytics */}
      <div className="space-y-6">
        <MaintenanceKPIs />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Placeholder for future chart or another component */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 relative pl-4 border-l-2 border-muted">
              {activityFeed.map((item) => (
                <div key={item.id} className="relative">
                  <div className={cn(
                    "absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-background",
                    item.type === 'work_order' ? "bg-blue-500" : "bg-green-500"
                  )} />
                  <div className="flex justify-between items-start group cursor-default">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", item.bg, item.color)}>
                          {item.type === 'work_order' ? 'OT' : 'INV'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.date!).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity -mt-2">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats / Sidebar */}
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Estado General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-primary-foreground/80">Disponibilidad Planta</span>
                <span className="text-2xl font-bold">92%</span>
              </div>
              <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: '92%' }} />
              </div>
              <p className="text-xs text-primary-foreground/70">
                Objetivo mensual: 95%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Accesos Directos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Link href="/assets">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Ver Todos los Activos
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Consultar Stock
                </Button>
              </Link>
              <Link href="/work-orders">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Reportes de Mantenimiento
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}
