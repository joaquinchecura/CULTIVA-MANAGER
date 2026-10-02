'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { SignOutButton, OrganizationSwitcher } from '@clerk/nextjs'
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
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

// Temas de color por grupo.
// Las clases van escritas completas (no armadas dinámicamente) para que Tailwind las detecte.
const themes = {
  blue: {
    title: 'text-blue-500 hover:text-blue-700',
    divider: 'bg-blue-200',
    idleIcon: 'text-blue-400',
    hover: 'hover:bg-blue-50/70 hover:text-blue-800',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    activeIcon: 'text-blue-600',
    dot: 'bg-blue-600',
  },
  emerald: {
    title: 'text-emerald-500 hover:text-emerald-700',
    divider: 'bg-emerald-200',
    idleIcon: 'text-emerald-400',
    hover: 'hover:bg-emerald-50/70 hover:text-emerald-800',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-700',
    activeIcon: 'text-emerald-600',
    dot: 'bg-emerald-600',
  },
  violet: {
    title: 'text-violet-500 hover:text-violet-700',
    divider: 'bg-violet-200',
    idleIcon: 'text-violet-400',
    hover: 'hover:bg-violet-50/70 hover:text-violet-800',
    activeBg: 'bg-violet-50',
    activeText: 'text-violet-700',
    activeIcon: 'text-violet-600',
    dot: 'bg-violet-600',
  },
  amber: {
    title: 'text-amber-500 hover:text-amber-700',
    divider: 'bg-amber-200',
    idleIcon: 'text-amber-400',
    hover: 'hover:bg-amber-50/70 hover:text-amber-800',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-700',
    activeIcon: 'text-amber-600',
    dot: 'bg-amber-600',
  },
  rose: {
    title: 'text-rose-500 hover:text-rose-700',
    divider: 'bg-rose-200',
    idleIcon: 'text-rose-400',
    hover: 'hover:bg-rose-50/70 hover:text-rose-800',
    activeBg: 'bg-rose-50',
    activeText: 'text-rose-700',
    activeIcon: 'text-rose-600',
    dot: 'bg-rose-600',
  },
  slate: {
    title: 'text-slate-500 hover:text-slate-700',
    divider: 'bg-slate-200',
    idleIcon: 'text-slate-400',
    hover: 'hover:bg-slate-100 hover:text-slate-900',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-800',
    activeIcon: 'text-slate-700',
    dot: 'bg-slate-600',
  },
} as const

type ThemeKey = keyof typeof themes

// Grupos de navegación
const navGroups: {
  title: string
  theme: ThemeKey
  items: { href: string; label: string; icon: React.ElementType }[]
}[] = [
  {
    title: 'Principal',
    theme: 'blue',
    items: [
      { href: '/admin', label: 'Inicio', icon: Home },
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Gestión',
    theme: 'emerald',
    items: [
      { href: '/admin/clientes', label: 'Clientes', icon: Users },
      { href: '/admin/planes', label: 'Membresías', icon: CalendarDays },
      { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
      { href: '/admin/clientes/vincular', label: 'Vincular', icon: Link2 },
    ],
  },
  {
    title: 'Operaciones',
    theme: 'violet',
    items: [
      { href: '/admin/agenda', label: 'Agenda Clases', icon: CalendarDays },
      { href: '/admin/agenda-pt', label: 'Agenda P.T.', icon: UserCircle2 },
      { href: '/admin/actividades', label: 'Actividades', icon: Dumbbell },
      { href: '/admin/acceso', label: 'Acceso', icon: Scan },
    ],
  },
  {
    title: 'Herramientas',
    theme: 'amber',
    items: [
      { href: '/admin/herramientas', label: 'Apps', icon: Wrench },
      { href: '/admin/rutinas', label: 'Rutinas', icon: ClipboardList },
      { href: '/admin/ejercicios', label: 'Ejercicios', icon: BookOpen },
      { href: '/admin/noticias', label: 'Noticias', icon: Newspaper },
    ],
  },
  {
    title: 'Reportes',
    theme: 'rose',
    items: [
      { href: '/admin/estadisticas', label: 'Estadísticas', icon: BarChart3 },
      { href: '/admin/reportes', label: 'Reportes', icon: FileText },
    ],
  },
  {
    title: 'Sistema',
    theme: 'slate',
    items: [
      { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

const STORAGE_KEY = 'cultiva-sidebar-collapsed'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Recordar la preferencia (se lee después del montaje para evitar errores de hidratación)
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setSidebarCollapsed(true)
    } catch {}
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }

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
      <aside
        className={cn(
          'bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-40',
          'transition-[width] duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Botón para colapsar / expandir (sobre el borde) */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Ocultar menú'}
          title={sidebarCollapsed ? 'Expandir menú' : 'Ocultar menú'}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        {/* Logo */}
        <div className={cn('border-b border-slate-100', sidebarCollapsed ? 'p-4' : 'p-5')}>
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
              <img
                src="/icons/android-chrome-192x192.png"
                alt="Cultiva Manager"
                className="w-full h-full object-cover"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold text-slate-900 leading-tight truncate">
                  Cultiva Fitness
                </h1>
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  Manager
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group) => {
            const t = themes[group.theme]
            // En modo iconos siempre se muestran todos los items
            const isGroupCollapsed =
              !sidebarCollapsed && collapsedGroups.includes(group.title)

            return (
              <div key={group.title} className="mb-3">
                {sidebarCollapsed ? (
                  // Separador de color en lugar del título
                  <div className={cn('mx-3 my-2 h-0.5 rounded-full opacity-70', t.divider)} />
                ) : (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                      t.title
                    )}
                  >
                    {group.title}
                    <ChevronDown
                      size={14}
                      className={cn(
                        'transition-transform duration-200',
                        isGroupCollapsed && '-rotate-90'
                      )}
                    />
                  </button>
                )}

                {!isGroupCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={sidebarCollapsed ? item.label : undefined}
                          aria-label={item.label}
                          className={cn(
                            'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                            sidebarCollapsed
                              ? 'justify-center px-0 py-2.5'
                              : 'gap-3 px-3 py-2.5',
                            active
                              ? cn(t.activeBg, t.activeText)
                              : cn('text-slate-600', t.hover)
                          )}
                        >
                          <item.icon
                            size={sidebarCollapsed ? 20 : 18}
                            className={cn('shrink-0', active ? t.activeIcon : t.idleIcon)}
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          {!sidebarCollapsed && active && (
                            <div className={cn('ml-auto w-1.5 h-1.5 rounded-full', t.dot)} />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Organización activa — al fondo, uso ocasional */}
        <div className="px-3 py-3 border-t border-slate-100 space-y-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-slate-500 truncate">Tu cuenta</span>
            </div>
          )}
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                rootBox: sidebarCollapsed ? 'w-full flex justify-center' : 'w-full',
                organizationSwitcherTrigger: sidebarCollapsed
                  ? 'p-1.5 rounded-lg border border-slate-200'
                  : 'w-full justify-between px-2 py-1.5 rounded-lg border border-slate-200 text-sm',
                // En modo iconos solo queda el avatar de la organización
                ...(sidebarCollapsed && {
                  organizationPreviewTextContainer: 'hidden',
                  organizationSwitcherTriggerIcon: 'hidden',
                }),
              },
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <SignOutButton redirectUrl="/login">
            <button
              title={sidebarCollapsed ? 'Salir' : undefined}
              aria-label="Salir"
              className={cn(
                'w-full flex items-center rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all py-2.5',
                sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
              )}
            >
              <LogOut size={18} className="text-slate-400 shrink-0" />
              {!sidebarCollapsed && <span>Salir</span>}
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
      <main
        className={cn(
          'flex-1 p-6 pt-16 md:pt-6 min-h-screen transition-[margin] duration-300 ease-in-out',
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'
        )}
      >
        {children}
      </main>
    </div>
  )
}