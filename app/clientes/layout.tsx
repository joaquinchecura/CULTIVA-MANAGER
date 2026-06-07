'use client'

import { SignOutButton } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-bold text-slate-900">Mi Gimnasio</h1>
        <SignOutButton redirectUrl="/login">
          <button className="text-slate-500 hover:text-slate-700 p-1">
            <LogOut size={20} />
          </button>
        </SignOutButton>
      </header>
      <main className="p-4">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
        <a href="/clientes" className="text-sm text-slate-600">Inicio</a>
        <a href="/clientes/turnos" className="text-sm text-slate-600">Turnos</a>
        <a href="/clientes/rutina" className="text-sm text-slate-600">Rutina</a>
        <a href="/clientes/perfil" className="text-sm text-slate-600">Perfil</a>
      </nav>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-900">Mi Gimnasio</h1>
      </header>
      <main className="p-4">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around">
        <a href="/clientes" className="text-sm text-slate-600">Inicio</a>
        <a href="/clientes/turnos" className="text-sm text-slate-600">Turnos</a>
        <a href="/clientes/rutina" className="text-sm text-slate-600">Rutina</a>
        <a href="/clientes/perfil" className="text-sm text-slate-600">Perfil</a>
      </nav>
    </div>
  )
}