export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { requireOrgForPage } from '@/lib/get-org'
import { ArrowLeft, TrendingUp, Scale, Ruler, Activity, Target } from 'lucide-react'
import Link from 'next/link'
import NuevoRegistroProgreso from './NuevoRegistroProgreso'
import ProgresoCharts from './ProgresoCharts'

export default async function ClienteProgresoPage({ params }: { params: Promise<{ id: string }> }) {
  const orgId = await requireOrgForPage()
  const { id } = await params

  const member = await prisma.member.findFirst({
    where: { id, organizationId: orgId },
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

  const chartRecords = [...member.bodyCompositions].reverse().map(r => ({
    createdAt: r.createdAt.toISOString(),
    weight: Number(r.weight),
    bodyFatPercent: r.bodyFatPercent ? Number(r.bodyFatPercent) : null,
    musclePercent: r.musclePercent ? Number(r.musclePercent) : null,
    bmi: r.bmi ? Number(r.bmi) : null,
  }))

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header compacto */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clientes/${id}`} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Progreso de {member.firstName}</h1>
          <p className="text-xs text-slate-500">DNI: {member.dni}</p>
        </div>
      </div>

      {/* KPIs compactos con colores pastel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Scale size={14} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Peso actual</span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {lastRecord ? `${Number(lastRecord.weight)}` : "—"} <span className="text-sm font-normal text-blue-500">kg</span>
          </p>
          {weightChange !== null && (
            <p className={`text-[10px] mt-1 font-medium ${weightChange <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg vs anterior
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Ruler size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">IMC / BMI</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            {lastRecord?.bmi ? `${Number(lastRecord.bmi)}` : "—"}
          </p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">
            {lastRecord?.bmi
              ? Number(lastRecord.bmi) < 18.5 ? 'Bajo peso'
                : Number(lastRecord.bmi) < 25 ? 'Normal'
                : Number(lastRecord.bmi) < 30 ? 'Sobrepeso'
                : 'Obesidad'
              : 'Sin datos'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <Activity size={14} className="text-orange-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Grasa corporal</span>
          </div>
          <p className="text-xl font-bold text-orange-700">
            {lastRecord?.bodyFatPercent ? `${Number(lastRecord.bodyFatPercent)}%` : "—"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Target size={14} className="text-violet-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Meta</span>
          </div>
          <p className="text-xl font-bold text-violet-700">
            {lastRecord?.targetWeight ? `${Number(lastRecord.targetWeight)}` : "—"} <span className="text-sm font-normal text-violet-500">kg</span>
          </p>
          <p className="text-[10px] text-violet-500 mt-1 font-medium">Peso objetivo</p>
        </div>
      </div>

      {/* Gráficos (achicados) */}
      {member.bodyCompositions.length > 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <ProgresoCharts records={chartRecords} />
        </div>
      )}

      {/* Formulario nuevo registro (compactado) */}
      <NuevoRegistroProgreso memberId={member.id} />

      {/* Historial en formato de tabla más compacta */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Historial completo
          </h3>
          <span className="text-xs text-slate-400">{member.bodyCompositions.length} registros</span>
        </div>
        {member.bodyCompositions.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <p className="text-sm">Sin registros todavía</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Peso</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">BMI</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Grasa</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Músculo</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {member.bodyCompositions.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {new Date(r.createdAt).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">
                      {Number(r.weight)} kg
                    </td>
                    <td className="px-4 py-2 text-slate-600 text-xs">
                      {r.bmi ? Number(r.bmi) : '—'}
                    </td>
                    <td className="px-4 py-2 text-orange-600 text-xs font-medium">
                      {r.bodyFatPercent ? `${Number(r.bodyFatPercent)}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-emerald-600 text-xs font-medium">
                      {r.musclePercent ? `${Number(r.musclePercent)}%` : '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-500 text-xs truncate max-w-[150px]">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}