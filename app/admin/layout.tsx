'use client'

import { 
  SignOutButton 
} from '@clerk/nextjs'
import { 
  LogOut, 
  Scan, 
  Home, 
  Users, 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  Link2,
  ClipboardList,
  BookOpen,
  Newspaper 
} from 'lucide-react'

const navItems = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/actividades", label: "Actividades", icon: Dumbbell },
  { href: "/admin/planes", label: "Membresías", icon: Calendar },
  { href: "/admin/agenda", label: "Agenda", icon: Calendar },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/clientes/vincular", label: "Vincular", icon: Link2 },
  { href: "/admin/acceso", label: "Acceso", icon: Scan },
  { href: "/admin/noticias", label: "Noticias", icon: Newspaper },
  { href: "/admin/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/admin/ejercicios", label: "Ejercicios", icon: BookOpen },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">Cultiva MANAGER</h1>
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <a 
                  key={item.href}
                  href={item.href} 
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <item.icon size={14} />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <SignOutButton redirectUrl="/login">
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1 rounded-lg hover:bg-slate-100">
              <LogOut size={16} />
              Salir
            </button>
          </SignOutButton>
        </div>
      </header>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}