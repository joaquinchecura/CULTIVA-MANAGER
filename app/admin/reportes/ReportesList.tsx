'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

const REPORTS = [
  { tipo: 'clientes', icon: '👥', title: 'Clientes activos', desc: 'Listado completo con plan, vencimiento y estado', usaPeriodo: false },
  { tipo: 'pagos', icon: '💳', title: 'Pagos del período', desc: 'Detalle de transacciones completadas y pendientes', usaPeriodo: true },
  { tipo: 'asistencias', icon: '📅', title: 'Asistencias', desc: 'Registro de entradas por fecha y cliente', usaPeriodo: true },
  { tipo: 'actividades', icon: '🏋️', title: 'Actividades más populares', desc: 'Reservas y ocupación por actividad', usaPeriodo: true },
  { tipo: 'por-vencer', icon: '⚠️', title: 'Membresías por vencer', desc: 'Renovaciones de los próximos 15 días', usaPeriodo: false },
  { tipo: 'crecimiento', icon: '📈', title: 'Crecimiento mensual', desc: 'Altas, ingresos y asistencias de los últimos 6 meses', usaPeriodo: false },
]

const iso = (d: Date) => d.toISOString().slice(0, 10)

export default function ReportesList() {
  const now = new Date()
  const [desde, setDesde] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [hasta, setHasta] = useState(iso(now))
  const invalido = desde > hasta

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <p className="text-xs text-slate-400 pb-2">
          {invalido ? <span className="text-red-500">La fecha “desde” no puede ser posterior a “hasta”.</span>
            : 'El período aplica a Pagos, Asistencias y Actividades.'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Reportes disponibles</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {REPORTS.map((r) => {
            const href = `/admin/reportes/${r.tipo}?desde=${desde}&hasta=${hasta}`
            const disabled = r.usaPeriodo && invalido
            return (
              <div key={r.tipo} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">{r.icon}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-slate-900">{r.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                </div>
                <a href={disabled ? undefined : href} download aria-disabled={disabled}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    disabled ? 'text-slate-300 pointer-events-none' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}>
                  <Download className="w-4 h-4" /> Generar
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}