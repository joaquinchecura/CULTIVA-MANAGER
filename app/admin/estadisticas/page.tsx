export const dynamic = 'force-dynamic'

export default function EstadisticasPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Estadísticas</h2>
        <p className="text-slate-500 mt-1">Análisis detallado del gimnasio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Crecimiento de clientes</h3>
          <p className="text-slate-500 mt-2">Gráfico de nuevos clientes por mes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Ingresos</h3>
          <p className="text-slate-500 mt-2">Evolución de recaudación mensual</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏋️</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Asistencias</h3>
          <p className="text-slate-500 mt-2">Horarios pico y días más concurridos</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Retención</h3>
          <p className="text-slate-500 mt-2">Tasa de membresías renovadas vs canceladas</p>
        </div>
      </div>
    </div>
  )
}