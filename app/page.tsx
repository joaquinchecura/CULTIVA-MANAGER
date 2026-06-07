import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    // Si está logueado, redirige al admin
    redirect('/admin')
  }
  
  // Si NO está logueado, muestra la página de inicio
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Gym Management</h1>
        <div className="space-y-2">
          <a href="/login" className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Iniciar Sesión
          </a>
        </div>
      </div>
    </div>
  )
}