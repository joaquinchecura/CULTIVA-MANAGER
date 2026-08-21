// app/admin/clientes/[id]/rutinas/page.tsx
export const dynamic = "force-dynamic"

import { prisma } from "@/lib/prisma"
import { getRoutineHistoryForMember } from "@/app/actions/routines"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Dumbbell, CheckCircle2, Clock, Calendar,
  TrendingUp, Target, ChevronRight, Archive,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const TZ = "America/Argentina/Buenos_Aires"

const goalLabels: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia", STRENGTH: "Fuerza", ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de peso", MAINTENANCE: "Mantenimiento", REHABILITATION: "Rehabilitación",
}

const goalColors: Record<string, string> = {
  HYPERTROPHY: "bg-blue-50 text-blue-700 border-blue-200",
  STRENGTH: "bg-red-50 text-red-700 border-red-200",
  ENDURANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WEIGHT_LOSS: "bg-orange-50 text-orange-700 border-orange-200",
  MAINTENANCE: "bg-purple-50 text-purple-700 border-purple-200",
  REHABILITATION: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

function fmtFecha(d: Date | string) {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "numeric", month: "short", year: "numeric", timeZone: TZ,
  })
}

export default async function ClienteRutinasHistorialPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [member, routines] = await Promise.all([
    prisma.member.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, dni: true },
    }),
    getRoutineHistoryForMember(id),
  ])

  if (!member) return notFound()

  // Progreso por rutina + rango de fechas real (primer/último día completado)
  function analyze(routine: (typeof routines)[number]) {
    const total = routine.days.length
    const completedDays = routine.days.filter(d => d.sessionLogs.some(l => l.completedAt))
    const completed = completedDays.length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0

    const completedDates = routine.days
      .flatMap(d => d.sessionLogs.filter(l => l.completedAt).map(l => l.completedAt as Date))
      .sort((a, b) => a.getTime() - b.getTime())

    const startDate = completedDates[0] ?? routine.createdAt
    const endDate = completedDates[completedDates.length - 1] ?? null

    return { total, completed, pct, startDate, endDate }
  }

  const enriched = routines.map(r => ({ routine: r, stats: analyze(r) }))

  // Agrupar por año (según fecha de inicio real)
  const byYear = enriched.reduce((acc, item) => {
    const year = new Date(item.stats.startDate).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {} as Record<number, typeof enriched>)

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  // Stats globales
  const totalRoutines = routines.length
  const totalCompleted = enriched.filter(e => e.stats.pct === 100).length
  const totalSessions = enriched.reduce((sum, e) => sum + e.stats.total, 0)
  const totalSessionsCompleted = enriched.reduce((sum, e) => sum + e.stats.completed, 0)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clientes/${id}`}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de rutinas</h1>
          <p className="text-sm text-slate-500">
            {member.firstName} {member.lastName} · DNI {member.dni}
          </p>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={15} className="text-blue-600" />
            <span className="text-xs text-slate-500">Rutinas totales</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalRoutines}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="text-xs text-slate-500">Completadas al 100%</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={15} className="text-violet-600" />
            <span className="text-xs text-slate-500">Sesiones totales</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalSessions}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-orange-600" />
            <span className="text-xs text-slate-500">Sesiones hechas</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{totalSessionsCompleted}</p>
        </div>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Archive className="mx-auto text-slate-300 mb-3" size={44} />
          <p className="text-slate-500 font-medium">Sin rutinas registradas</p>
          <p className="text-sm text-slate-400 mt-1">
            Este cliente todavía no tuvo ninguna rutina asignada
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year} className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{year}</h2>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">
                  {byYear[year].length} {byYear[year].length === 1 ? "rutina" : "rutinas"}
                </span>
              </div>

              <div className="space-y-3">
                {byYear[year]
                  .sort((a, b) => new Date(b.stats.startDate).getTime() - new Date(a.stats.startDate).getTime())
                  .map(({ routine, stats }) => (
                    <Link
                      key={routine.id}
                      href={`/admin/rutinas/${routine.id}`}
                      className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-base font-bold text-slate-900">{routine.name}</h3>
                            {routine.isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ACTIVA
                              </span>
                            )}
                            {routine.goal && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${goalColors[routine.goal] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                {goalLabels[routine.goal] || routine.goal}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {fmtFecha(stats.startDate)}
                              {stats.endDate && stats.endDate !== stats.startDate && (
                                <> → {fmtFecha(stats.endDate)}</>
                              )}
                            </span>
                            <span>
                              {routine.frequencyPerWeek} ses/sem · {routine.totalWeeks} semanas
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${stats.pct === 100 ? "text-emerald-600" : "text-slate-700"}`}>
                              {stats.pct}%
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {stats.completed}/{stats.total} sesiones
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stats.pct === 100 ? "bg-emerald-500" : "bg-blue-400"
                          }`}
                          style={{ width: `${stats.pct}%` }}
                        />
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}