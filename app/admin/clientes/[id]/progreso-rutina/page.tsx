export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { requireOrgForPage } from '@/lib/get-org'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, Weight, Trophy, Zap, Calendar,
  Activity, Target, Flame, Dumbbell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientProgressChart } from '@/components/clientes/ClientProgressChart'

const TZ = 'America/Argentina/Buenos_Aires'

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ,
  })
}

// Colores pastel por tipo de ejercicio (para la lista)
const TYPE_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  STRENGTH: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Dumbbell },
  CARDIO: { bg: 'bg-red-50', text: 'text-red-700', icon: Flame },
  FUNCTIONAL: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Zap },
  MOBILITY: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Activity },
  DEFAULT: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Activity },
}

export default async function ClienteProgresoRutinaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const orgId = await requireOrgForPage()
  const { id } = await params

  const member = await prisma.member.findFirst({
    where: { id, organizationId: orgId },
    select: { id: true, firstName: true, lastName: true, dni: true },
  })

  if (!member) return notFound()

  const logs = await prisma.progressLog.findMany({
    where: { memberId: id, organizationId: orgId },
    orderBy: { date: 'desc' },
    include: {
      exercise: { select: { name: true, type: true, muscleGroup: true } },
    },
  })

  // Estadísticas generales
  const totalSets = logs.reduce((sum, l) => sum + l.setsCompleted, 0)
  const totalVolume = logs.reduce((sum, l) => sum + (l.weightUsed * parseInt(l.repsCompleted) || 0) * l.setsCompleted, 0)
  const totalExercises = new Set(logs.map(l => l.exerciseId)).size
  const uniqueDays = new Set(logs.map(l => new Date(l.date).toISOString().split('T')[0])).size

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clientes/${id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de Progreso de Rutina</h1>
          <p className="text-sm text-slate-500">
            {member.firstName} {member.lastName} · DNI {member.dni}
          </p>
        </div>
      </div>

      {/* KPIs con colores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Zap size={15} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Series totales</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{totalSets}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Weight size={15} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Volumen total</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{Math.round(totalVolume).toLocaleString('es-AR')} kg</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-violet-100 rounded-lg">
              <Calendar size={15} className="text-violet-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Días activos</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{uniqueDays}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <Activity size={15} className="text-orange-600" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Ejercicios</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalExercises}</p>
        </div>
      </div>

      {/* Gráfico Global */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-slate-400" />
          Progreso por Ejercicio (Peso actual)
        </h3>
        <ClientProgressChart
          data={logs.map(log => ({
            exerciseName: log.exercise.name,
            exerciseType: log.exercise.type || 'STRENGTH',
            date: log.date.toISOString(),
            weightUsed: Number(log.weightUsed),
            setsCompleted: log.setsCompleted,
            repsCompleted: log.repsCompleted,
          }))}
        />
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            Últimos registros
          </h3>
          <span className="text-xs text-slate-400">{logs.length} registros en total</span>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <TrendingUp size={40} className="mx-auto mb-3 text-slate-300" />
            <p>Sin registros de progreso todavía</p>
            <p className="text-sm text-slate-400 mt-1">Los datos aparecerán cuando el cliente entrene</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
            {logs.map((log) => {
              const style = TYPE_STYLES[log.exercise.type] || TYPE_STYLES.DEFAULT
              const Icon = style.icon
              return (
                <div key={log.id} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${style.bg} ${style.text} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">{log.exercise.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                        {log.exercise.muscleGroup || log.exercise.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {log.setsCompleted} series × {log.repsCompleted} reps
                      {log.notes && ` · ${log.notes}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-slate-800">{log.weightUsed} kg</p>
                    <p className="text-xs text-slate-400">{fmtFecha(log.date)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}