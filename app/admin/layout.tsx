'use client'

import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LogOut,
  Home,
  LayoutDashboard,
  Users,
  Dumbbell,
  CalendarDays,
  CreditCard,
  Link2,
  Scan,
  Newspaper,
  ClipboardList,
  BookOpen,
  BarChart3,
  FileText,
  ChevronDown,
  Settings,  
  UserCircle2, 
} from 'lucide-react'
import { useState } from 'react'

// Grupos de navegación
const navGroups = [
  {
    title: 'Principal',
    items: [
      { href: '/admin', label: 'Inicio', icon: Home },
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/planes', label: 'Membresías', icon: CalendarDays },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
      { href: '/admin/clientes/vincular', label: 'Vincular', icon: Link2 },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { href: '/admin/rutinas', label: 'Rutinas', icon: ClipboardList },
      { href: '/admin/ejercicios', label: 'Ejercicios', icon: BookOpen },
      { href: '/admin/actividades', label: 'Actividades', icon: Dumbbell },
      { href: '/admin/noticias', label: 'Noticias', icon: Newspaper },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/admin/agenda', label: 'Agenda Grupales', icon: CalendarDays },
      { href: '/admin/agenda-pt', label: 'Agenda Personal', icon: UserCircle2 },
      { href: '/admin/acceso', label: 'Acceso', icon: Scan },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { href: '/admin/estadisticas', label: 'Estadísticas', icon: BarChart3 },
      { href: '/admin/reportes', label: 'Reportes', icon: FileText },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Cultiva</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Manager</p>
            </div>
          </div>
        </div>

        {/* Navegación con viñetas */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.includes(group.title)

            return (
              <div key={group.title} className="mb-3">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                >
                  {group.title}
                  <ChevronDown
                    size={14}
                    className={cn(
                      'transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive(item.href)
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        )}
                      >
                        <item.icon
                          size={18}
                          className={cn(
                            isActive(item.href) ? 'text-blue-600' : 'text-slate-400'
                          )}
                        />
                        <span>{item.label}</span>
                        {isActive(item.href) && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <SignOutButton redirectUrl="/login">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              <LogOut size={18} className="text-slate-400" />
              <span>Salir</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <h1 className="font-bold text-slate-900">Cultiva Manager</h1>
        </div>
        {/* Mobile menu button - podés agregar un drawer si querés */}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 pt-16 md:pt-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}