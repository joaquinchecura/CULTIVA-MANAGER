import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()
  
  if (userId) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">C</span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Cultiva</h1>
        <p className="text-lg text-slate-500">Manager — Panel de Administración</p>
      </div>

      <a 
        href="/admin/login"
        className="block w-full max-w-sm bg-slate-900 text-white text-center py-4 rounded-2xl font-semibold text-lg hover:bg-slate-800 transition"
      >
        Acceder al Panel
      </a>
    </div>
  )
}