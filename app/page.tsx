import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  
  // Si ya está logueado, redirigir según rol
  if (userId) {
    redirect('/redirect')
  }

  // Si no está logueado, mostrar landing
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">C</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Cultiva</h1>
        <p className="text-lg text-slate-500">Manager</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Opción Admin */}
        <a 
          href="/admin/login"
          className="block w-full bg-slate-900 text-white text-center py-4 rounded-2xl font-semibold text-lg hover:bg-slate-800 transition"
        >
          Soy Administrador
        </a>

        {/* Opción Clientes */}
        <a 
          href="/clientes/login"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-2xl font-semibold text-lg hover:bg-blue-700 transition"
        >
          Soy Cliente
        </a>
      </div>

      <p className="text-sm text-slate-400 mt-8">
        ¿Primera vez? Creá tu cuenta desde la app de cliente
      </p>
    </div>
  )
}