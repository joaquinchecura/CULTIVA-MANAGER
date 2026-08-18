import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Textura de fondo: grid de puntos, sutil */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Resplandor detrás de la card central */}
      <div className="absolute w-[480px] h-[480px] bg-blue-200/40 rounded-full blur-3xl" />

      {/* Tarjetas fantasma del panel real, como vista previa borrosa */}
      <div className="hidden sm:block absolute top-16 left-10 lg:left-24 w-52 rotate-[-6deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Clientes</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">128</p>
        </div>
      </div>

      <div className="hidden sm:block absolute bottom-20 right-10 lg:right-28 w-52 rotate-[5deg] opacity-50 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Asistencias Hoy</span>
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">34</p>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-32 left-24 w-48 rotate-[4deg] opacity-40 blur-[1.5px] pointer-events-none select-none">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Recaudación</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">$4.2k</p>
        </div>
      </div>

      {/* Card central */}
      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/60 p-10">
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mb-6">
            Gestión de Gimnasios
          </span>

          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <span className="text-2xl font-bold text-white">C</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Cultiva</h1>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-3">
            Manager
          </p>

          <p className="text-sm text-slate-500 mb-8">
            Panel de Administración
          </p>

          <a
            href="/admin/login"
            className="group w-full bg-blue-600 text-white text-center py-3.5 rounded-2xl font-semibold text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Acceder al Panel
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>

          <div className="flex items-center gap-2 mt-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-slate-400">Sistema en línea</span>
          </div>
        </div>
      </div>
    </div>
  )
}