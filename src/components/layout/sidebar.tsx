'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Wrench,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    HardHat
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { signout } from '@/app/login/actions'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'operario'] },
    { name: 'Activos', href: '/assets', icon: Settings, roles: ['admin', 'supervisor', 'operario'] },
    { name: 'Órdenes de Trabajo', href: '/work-orders', icon: Wrench, roles: ['admin', 'supervisor', 'operario'] },
    { name: 'Inventario', href: '/inventory', icon: Package, roles: ['admin', 'supervisor', 'operario'] },
    { name: 'Operarios', href: '/admin/operators', icon: HardHat, roles: ['admin', 'supervisor'] },
]

interface SidebarProps {
    profile: {
        full_name: string | null
        role: string | null
        email: string | null
    } | null
}

export function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const userRole = profile?.role || 'invitado'
    const userName = profile?.full_name || profile?.email || 'Usuario'

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo / Header */}
                    <div className="h-20 flex items-center justify-center px-6 border-b bg-white/50">
                        {/* Logo */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/lory-logo-full.png" alt="LORY" className="h-12 w-auto object-contain" />
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t">
                        {profile ? (
                            <div className="flex items-center mb-4">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3 overflow-hidden">
                                    <p className="text-sm font-medium truncate" title={userName}>{userName}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center mb-4 px-2">
                                <p className="text-sm text-muted-foreground">No autenticado</p>
                            </div>
                        )}

                        {profile && (
                            <form action={signout}>
                                <button type="submit" className="w-full flex items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                                    <LogOut className="mr-3 h-4 w-4" />
                                    Cerrar Sesión
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
