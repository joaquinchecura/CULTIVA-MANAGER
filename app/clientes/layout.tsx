'use client'

import { SignOutButton } from '@clerk/nextjs'
import { LogOut, Home, Calendar, Dumbbell, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/clientes', icon: Home, label: 'Inicio' },
    { href: '/clientes/turnos', icon: Calendar, label: 'Turnos' },
    { href: '/clientes/rutina', icon: Dumbbell, label: 'Rutina' },
    { href: '/clientes/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-900">Cultiva</h1>
        <SignOutButton redirectUrl="/login">
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <LogOut size={20} />
          </button>
        </SignOutButton>
      </header>

      {/* Contenido */}
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation (estilo app móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}