'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartRecord {
  createdAt: string
  weight: number
  bodyFatPercent: number | null
  musclePercent: number | null
  bmi: number | null
}

interface Props {
  records: ChartRecord[]
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 11,
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
}

export default function ProgresoCharts({ records }: Props) {
  const data = records.map((r) => ({
    fecha: new Date(r.createdAt).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    }),
    peso: r.weight,
    grasa: r.bodyFatPercent,
    musculo: r.musclePercent,
    bmi: r.bmi,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Evolución</h3>
        <span className="text-xs text-slate-400">Últimos {records.length} registros</span>
      </div>

      {/* Gráficos en paralelo en desktop, apilados en mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Peso */}
        <div className="bg-gradient-to-br from-blue-50/50 to-white border border-blue-100 rounded-xl p-3">
          <p className="text-xs text-blue-700 mb-2 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Peso (kg)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grasa y Músculo */}
        <div className="bg-gradient-to-br from-orange-50/50 to-white border border-orange-100 rounded-xl p-3">
          <p className="text-xs text-orange-700 mb-2 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Composición corporal (%)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} iconType="circle" iconSize={8} />
              <Line
                type="monotone"
                dataKey="grasa"
                name="% Grasa"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="musculo"
                name="% Músculo"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}