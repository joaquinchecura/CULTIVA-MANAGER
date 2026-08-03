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
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Evolución</h3>

      <div className="space-y-6">
        {/* Peso */}
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium">Peso (kg)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grasa y Músculo */}
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium">Composición corporal (%)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="grasa"
                name="% Grasa"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="musculo"
                name="% Músculo"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}