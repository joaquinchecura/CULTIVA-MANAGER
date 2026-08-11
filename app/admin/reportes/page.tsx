export const dynamic = 'force-dynamic'

export default function ReportesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Reportes</h2>
        <p className="text-slate-500 mt-1">Generación y exportación de informes</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Reportes disponibles</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { icon: '👥', title: 'Clientes activos', desc: 'Listado completo con membresías y estado' },
            { icon: '💳', title: 'Pagos del período', desc: 'Detalle de transacciones completadas y pendientes' },
            { icon: '📅', title: 'Asistencias', desc: 'Registro de entradas por fecha y cliente' },
            { icon: '🏋️', title: 'Actividades más populares', desc: 'Clases con mayor ocupación' },
            { icon: '⚠️', title: 'Membresías por vencer', desc: 'Alertas de renovaciones próximas' },
            { icon: '📈', title: 'Crecimiento mensual', desc: 'Comparativa de métricas clave' },
          ].map((report) => (
            <div key={report.title} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                {report.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900">{report.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{report.desc}</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                Generar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-blue-900">💡 Próximamente</h4>
        <p className="text-sm text-blue-700 mt-1">
          Exportación a PDF y Excel, filtros por fecha, y reportes programados automáticos.
        </p>
      </div>
    </div>
  )
}