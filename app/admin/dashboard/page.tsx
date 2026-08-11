export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Métricas y visualizaciones avanzadas</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Dashboard en construcción</h3>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          Acá se mostrarán gráficos interactivos, tendencias de asistencia, evolución de pagos y más.
        </p>
      </div>
    </div>
  )
}