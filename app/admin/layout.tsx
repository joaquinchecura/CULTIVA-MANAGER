'use client'

import { SignOutButton } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

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
            <h1 className="text-xl font-bold text-slate-900">Gym Management</h1>
            <nav className="flex gap-4">
              <a href="/admin" className="text-sm text-slate-600 hover:text-slate-900">Dashboard</a>
              <a href="/admin/clientes" className="text-sm text-slate-600 hover:text-slate-900">Clientes</a>
              <a href="/admin/actividades" className="text-sm text-slate-600 hover:text-slate-900">Actividades</a>
              <a href="/admin/planes" className="text-sm text-slate-600 hover:text-slate-900">Planes</a>
              <a href="/admin/agenda" className="text-sm text-slate-600 hover:text-slate-900">Agenda</a>
              <a href="/admin/pagos" className="text-sm text-slate-600 hover:text-slate-900">Pagos</a>
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