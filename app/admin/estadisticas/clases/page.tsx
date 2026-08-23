export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, Users, CheckCircle2, XCircle,
  Dumbbell, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function EstadisticasClasesPage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string }>
}) {
  const params = await searchParams
  const now = new Date()

  const schedules = await prisma.schedule.findMany({
    where: {
      isCancelled: false,
      date: { lt: now },
      mactivity: { type: 'GROUP' }
    },
    include: { activity: true, bookings: true },
    orderBy: { date: 'desc' },
    take: 200,
  })

  const byActivity = new Map<string, {
    id: string
    name: string
    totalClasses: number
    totalBookings: number
    completed: number
    noShow: number
  }>()

  schedules.forEach(s => {
    if (!byActivity.has(s.activityId)) {
      byActivity.set(s.activityId, {
        id: s.activityId, name: s.activity.name,
        totalClasses: 0, totalBookings: 0, completed: 0, noShow: 0,
      })
    }
    const entry = byActivity.get(s.activityId)!
    entry.totalClasses++
    s.bookings.forEach(b => {
      if (b.status === 'COMPLETED') { entry.completed++; entry.totalBookings++ }
      if (b.status === 'NO_SHOW') { entry.noShow++; entry.totalBookings++ }
    })
  })

  const activityStats = Array.from(byActivity.values())
    .map(a => ({
      ...a,
      attendanceRate: a.totalBookings > 0 ? Math.round((a.completed / a.totalBookings) * 100) : 0,
    }))
    .sort((a, b) => b.totalClasses - a.totalClasses)

  const totalClasses = schedules.length
  const totalCompleted = activityStats.reduce((s, a) => s + a.completed, 0)
  const totalNoShow = activityStats.reduce((s, a) => s + a.noShow, 0)
  const overallRate = totalCompleted + totalNoShow > 0
    ? Math.round((totalCompleted / (totalCompleted + totalNoShow)) * 100)
    : 0

  // Drill-down: clientes de una actividad específica
  let clientBreakdown: { name: string; completed: number; noShow: number; rate: number }[] = []
  let selectedActivityName = ''

  if (params.activityId) {
    const activity = await prisma.activity.findUnique({ where: { id: params.activityId } })
    selectedActivityName = activity?.name || ''

    const activityBookings = await prisma.booking.findMany({
      where: {
        schedule: {
          activityId: params.activityId,
          isCancelled: false,
          date: { lt: now },
          maxCapacity: { gt: 1 },
        },
        status: { in: ['COMPLETED', 'NO_SHOW'] },
      },
      include: { member: { select: { firstName: true, lastName: true } } },
    })

    const byMember = new Map<string, { name: string; completed: number; noShow: number }>()
    activityBookings.forEach(b => {
      const name = `${b.member.firstName} ${b.member.lastName}`
      if (!byMember.has(name)) byMember.set(name, { name, completed: 0, noShow: 0 })
      const e = byMember.get(name)!
      if (b.status === 'COMPLETED') e.completed++
      if (b.status === 'NO_SHOW') e.noShow++
    })

    clientBreakdown = Array.from(byMember.values())
      .map(m => ({ ...m, rate: m.completed + m.noShow > 0 ? Math.round((m.completed / (m.completed + m.noShow)) * 100) : 0 }))
      .sort((a, b) => b.completed - a.completed)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/agenda">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estadísticas de clases grupales</h1>
          <p className="text-sm text-slate-500">Últimas {totalClasses} clases finalizadas</p>
        </div>
      </div>

      {/* KPIs generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={15} className="text-blue-600" />
            <span className="text-xs text-slate-500">Clases dictadas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-violet-600" />
            <span className="text-xs text-slate-500">Asistencia general</span>
          </div>
          <p className="text-2xl font-bold text-violet-600">{overallRate}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="text-xs text-slate-500">Asistencias</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={15} className="text-red-600" />
            <span className="text-xs text-slate-500">Ausencias</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalNoShow}</p>
        </div>
      </div>

      {/* Por actividad — cada fila lleva al drill-down */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Por actividad
          </h3>
        </div>
        {activityStats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Sin clases finalizadas todavía
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {activityStats.map(a => (
              <Link
                key={a.id}
                href={`/admin/estadisticas/clases?activityId=${a.id}`}
                className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${
                  params.activityId === a.id ? 'bg-blue-50/60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.totalClasses} clases · {a.completed} asistencias · {a.noShow} ausencias
                  </p>
                </div>
                <div className="w-32 shrink-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Asistencia</span>
                    <span className="font-bold text-slate-700">{a.attendanceRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        a.attendanceRate >= 70 ? 'bg-emerald-500' :
                        a.attendanceRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${a.attendanceRate}%` }}
                    />
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Drill-down: clientes de la actividad seleccionada */}
      {params.activityId && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users size={15} className="text-blue-600" />
              Clientes — {selectedActivityName}
            </h3>
            <Link href="/admin/estadisticas/clases" className="text-xs text-blue-600 hover:underline">
              Ver todas las actividades
            </Link>
          </div>
          {clientBreakdown.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Sin asistencia marcada todavía para esta actividad
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {clientBreakdown.map(c => (
                <div key={c.name} className="px-5 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{c.name}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold">{c.completed} ✓</span>
                    <span className="text-red-500">{c.noShow} ausente</span>
                    <span className="text-slate-400 w-10 text-right">{c.rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}