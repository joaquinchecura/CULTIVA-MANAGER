'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Trophy } from 'lucide-react'

interface ExerciseProgress {
  exerciseName: string
  exerciseType: string
  date: string
  weightUsed: number
  setsCompleted: number
  repsCompleted: string
}

interface ProgressChartProps {
  data: ExerciseProgress[]
}

const TYPE_COLORS: Record<string, string> = {
  STRENGTH: "#3b82f6", CARDIO: "#ef4444", FUNCTIONAL: "#f59e0b", MOBILITY: "#10b981",
  STRETCHING: "#14b8a6", PLYOMETRIC: "#f97316", BALANCE: "#8b5cf6", TECHNIQUE: "#64748b",
  WARMUP: "#f43f5e", COOLDOWN: "#06b6d4", OTHER: "#6b7280",
}

// Función para acortar nombres largos
function shortenName(name: string) {
  const cleanName = name
    .replace(/Extensión de /i, 'Ext. ')
    .replace(/Elevación /i, 'Elev. ')
    .replace(/Press de /i, 'Press ')
    .replace(/Mancuerna/i, 'Manc.')
    .replace(/Máquina/i, 'Máq.')
    .replace(/Inclinado/i, 'Incl.')
    .replace(/Sentadilla/i, 'Sentad.')
    .replace(/Hombros/i, 'Homb.')
    .replace(/Tríceps/i, 'Tríc.')
    .replace(/Bíceps/i, 'Bíc.')
  
  return cleanName.length > 20 ? cleanName.slice(0, 18) + '...' : cleanName
}

export function ClientProgressChart({ data }: ProgressChartProps) {
  if (data.length === 0) return null

  // Agrupar por ejercicio
  const exerciseGroups = data.reduce((acc, d) => {
    if (!acc[d.exerciseName]) acc[d.exerciseName] = { name: d.exerciseName, type: d.exerciseType, entries: [] }
    acc[d.exerciseName].entries.push(d)
    return acc
  }, {} as Record<string, { name: string; type: string; entries: ExerciseProgress[] }>)

  // Calcular métricas por ejercicio
  const chartData = Object.values(exerciseGroups).map((group) => {
    const latest = group.entries[group.entries.length - 1]
    const allWeights = group.entries.map(e => e.weightUsed)
    const maxWeight = Math.max(...allWeights)
    const totalSets = group.entries.reduce((sum, e) => sum + e.setsCompleted, 0)

    return {
      name: group.name,
      shortName: shortenName(group.name), // 👈 Nombre acortado para el eje X
      type: group.type,
      weight: latest.weightUsed,
      maxWeight,
      sets: totalSets,
      color: TYPE_COLORS[group.type] || TYPE_COLORS["OTHER"],
    }
  }).sort((a, b) => b.weight - a.weight)

  const maxWeightExercise = chartData.reduce((max, d) => (d.maxWeight > max.maxWeight ? d : max), chartData[0])

  return (
    <div className="space-y-4">
      {/* Gráfico vertical */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={40}
              unit="kg"
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.03)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white rounded-lg p-3 shadow-lg text-xs space-y-1.5 border border-slate-200">
                    <p className="font-bold text-slate-900">{d.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-500">{d.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Último peso:</span>
                      <span className="font-medium text-right text-slate-900">{d.weight} kg</span>
                      <span className="text-slate-500">Máx peso:</span>
                      <span className="font-medium text-right text-slate-900">{d.maxWeight} kg</span>
                      <span className="text-slate-500">Series:</span>
                      <span className="font-medium text-right text-slate-900">{d.sets}</span>
                    </div>
                  </div>
                )
              }}
            />
            <Bar dataKey="weight" radius={[4, 4, 0, 0]} maxBarSize={45}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Récord personal */}
      {chartData.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Trophy size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            <span className="font-bold">{maxWeightExercise.name}</span> tiene el mayor peso registrado:{" "}
            <span className="font-bold">{maxWeightExercise.maxWeight} kg</span>
          </p>
        </div>
      )}
    </div>
  )
}