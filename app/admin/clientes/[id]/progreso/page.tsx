export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ArrowLeft, TrendingUp, Scale, Ruler, Activity, Target } from 'lucide-react'
import Link from 'next/link'
import NuevoRegistroProgreso from './NuevoRegistroProgreso'
import ProgresoCharts from './ProgresoCharts'

export default async function ClienteProgresoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      bodyCompositions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  const lastRecord = member.bodyCompositions[0] || null
  const previousRecord = member.bodyCompositions[1] || null

  const weightChange = lastRecord && previousRecord
    ? Number(lastRecord.weight) - Number(previousRecord.weight)
    : null

  // Serializar para charts
  const chartRecords = [...member.bodyCompositions].reverse().map(r => ({
    createdAt: r.createdAt.toISOString(),
    weight: Number(r.weight),
    bodyFatPercent: r.bodyFatPercent ? Number(r.bodyFatPercent) : null,
    musclePercent: r.musclePercent ? Number(r.musclePercent) : null,
    bmi: r.bmi ? Number(r.bmi) : null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clientes/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progreso de {member.firstName}</h1>
          <p className="text-slate-500">DNI: {member.dni}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={16} className="text-blue-600" />
            <span className="text-xs text-slate-500">Peso actual</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {lastRecord ? `${Number(lastRecord.weight)}` : "—"}
          </p>
          <p className="text-xs text-slate-500">kg</p>
          {weightChange !== null && (
            <p className={`text-xs mt-1 ${weightChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg vs anterior
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Ruler size={16} className="text-green-600" />
            <span className="text-xs text-slate-500">BMI</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {lastRecord?.bmi ? `${Number(lastRecord.bmi)}` : "—"}
          </p>
          <p className="text-xs text-slate-500">
            {lastRecord?.bmi
              ? Number(lastRecord.bmi) < 18.5 ? 'Bajo peso'
                : Number(lastRecord.bmi) < 25 ? 'Normal'
                : Number(lastRecord.bmi) < 30 ? 'Sobrepeso'
                : 'Obesidad'
              : 'Sin datos'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-orange-600" />
            <span className="text-xs text-slate-500">Grasa corporal</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {lastRecord?.bodyFatPercent ? `${Number(lastRecord.bodyFatPercent)}%` : "—"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-purple-600" />
            <span className="text-xs text-slate-500">Meta</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {lastRecord?.targetWeight ? `${Number(lastRecord.targetWeight)}` : "—"}
          </p>
          <p className="text-xs text-slate-500">kg objetivo</p>
        </div>
      </div>

      {/* Gráficos */}
      {member.bodyCompositions.length > 1 && (
        <ProgresoCharts records={chartRecords} />
      )}

      {/* Formulario */}
      <NuevoRegistroProgreso memberId={member.id} />

      {/* Historial */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Historial completo
          </h3>
        </div>
        {member.bodyCompositions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>Sin registros todavía</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Peso</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">BMI</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Grasa</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Músculo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {member.bodyCompositions.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {new Date(r.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {Number(r.weight)} kg
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {r.bmi ? Number(r.bmi) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {r.bodyFatPercent ? `${Number(r.bodyFatPercent)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {r.musclePercent ? `${Number(r.musclePercent)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">
                    {r.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}