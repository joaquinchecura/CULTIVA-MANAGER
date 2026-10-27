export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireOrgForPage } from '@/lib/get-org'
import {
  getOrgTimezone,
  startOfCurrentMonth,
  startOfPreviousMonth,
} from '@/lib/date-utils'
import {
  Users, CreditCard, Scan, CalendarCheck, ArrowUpRight, ArrowDownRight, Clock, Dumbbell,
} from 'lucide-react'
import { RevenueChart, AttendanceChart, HoursChart, DonutChart } from './DashboardCharts'

const ars = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Efectivo', TRANSFER: 'Transferencia', MERCADOPAGO: 'Mercado Pago', CARD: 'Tarjeta', OTHER: 'Otro',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activos', INACTIVE: 'Inactivos', FROZEN: 'Congelados', OVERDUE: 'Con deuda', PENDING: 'Pendientes',
}

function variation(curr: number, prev: number) {
  if (prev <= 0) return null
  return ((curr - prev) / prev) * 100
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return null
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${up ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
      <Icon size={12} />{Math.abs(value).toFixed(1)}%
    </span>
  )
}

function Card({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-slate-200 rounded-xl p-5 ${className}`}>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * Extrae el día y la hora de un Date, pero en la timezone del gimnasio.
 * Usamos Intl.DateTimeFormat para evitar problemas con offsets manuales.
 */
function getDayAndHourInTZ(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date)
  
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  
  return {
    day: `${get('month')}/${get('day')}`, // MM/DD
    hour: Number(get('hour')),
  }
}

export default async function DashboardPage() {
  const orgId = await requireOrgForPage()
  const tz = await getOrgTimezone(orgId)

  const now = new Date()
  
  // Usamos los helpers multi-tenant para los cálculos mensuales
  const monthStart = startOfCurrentMonth(tz)
  const prevMonthStart = startOfPreviousMonth(tz)
  
  // Para los gráficos de "últimos 6 meses", calculamos sobre los inicios de mes
  const sixMonthsAgo = new Date(monthStart)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  // Punto de comparación del mes anterior (mismo día del mes)
  const prevMonthSamePoint = new Date(prevMonthStart.getTime() + (now.getTime() - monthStart.getTime()))
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    membersByStatus,
    newMembersMonth,
    newMembersPrev,
    paymentsSixMonths,
    attendances30,
    activeMemberships,
    expiringSoon,
    schedules30,
    recentPayments,
    rutinasActivas,
  ] = await Promise.all([
    prisma.member.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: { _all: true } }),
    prisma.member.count({ where: { organizationId: orgId, createdAt: { gte: monthStart } } }),
    prisma.member.count({ where: { organizationId: orgId, createdAt: { gte: prevMonthStart, lt: prevMonthSamePoint } } }),
    prisma.payment.findMany({
      where: { organizationId: orgId, status: 'COMPLETED', createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, method: true, createdAt: true },
    }),
    prisma.attendance.findMany({
      where: { organizationId: orgId, entryTime: { gte: thirtyDaysAgo }, status: { in: ['ALLOWED', 'WARNING'] } },
      select: { entryTime: true },
    }),
    prisma.membership.findMany({
      where: { organizationId: orgId, status: 'ACTIVE', endDate: { gte: now } },
      select: { plan: { select: { name: true } } },
    }),
    prisma.membership.findMany({
      where: { organizationId: orgId, status: 'ACTIVE', endDate: { gte: now, lte: in7Days } },
      orderBy: { endDate: 'asc' },
      take: 6,
      select: {
        id: true, endDate: true,
        member: { select: { firstName: true, lastName: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.schedule.findMany({
      where: { organizationId: orgId, isCancelled: false, date: { gte: thirtyDaysAgo, lte: now } },
      select: { activity: { select: { name: true } }, _count: { select: { bookings: true } } },
    }),
    prisma.payment.findMany({
      where: { organizationId: orgId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, amount: true, concept: true, createdAt: true, member: { select: { firstName: true, lastName: true } } },
    }),
    prisma.routine.count({ where: { organizationId: orgId, isActive: true, isTemplate: false } }),
  ])

  // ── KPIs ────────────────────────────────────────────────
  const totalMembers = membersByStatus.reduce((a, g) => a + g._count._all, 0)
  const activeCount = membersByStatus.find((g) => g.status === 'ACTIVE')?._count._all ?? 0

  const revenueByMonth = new Map<string, number>()
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo)
    d.setMonth(d.getMonth() + i)
    revenueByMonth.set(`${d.getFullYear()}-${d.getMonth()}`, 0)
  }
  const methodTotals = new Map<string, number>()
  let revenueThisMonth = 0
  let revenuePrevMonth = 0
  for (const p of paymentsSixMonths) {
    const amt = Number(p.amount)
    const key = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth()}`
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + amt)
    if (p.createdAt >= monthStart) {
      revenueThisMonth += amt
      methodTotals.set(p.method, (methodTotals.get(p.method) ?? 0) + 1)
    } else if (p.createdAt >= prevMonthStart && p.createdAt < prevMonthSamePoint) revenuePrevMonth += amt
  }
  const revenueData = Array.from(revenueByMonth.entries()).map(([k, monto]) => ({
    mes: MESES[Number(k.split('-')[1])], monto,
  }))

  // Asistencias por día (últimos 30) y por hora
  const perDay = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, month: '2-digit', day: '2-digit',
    }).formatToParts(d)
    const month = parts.find(p => p.type === 'month')?.value
    const day = parts.find(p => p.type === 'day')?.value
    perDay.set(`${month}/${day}`, 0)
  }
  
  const perHour = new Array(24).fill(0)
  for (const a of attendances30) {
    const { day, hour } = getDayAndHourInTZ(a.entryTime, tz)
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + 1)
    perHour[hour]++
  }
  
  const attendanceData = Array.from(perDay.entries()).map(([k, asistencias]) => ({
    dia: `${k.slice(3)}/${k.slice(0, 2)}`, asistencias,
  }))
  const hoursData = perHour
    .map((asistencias, h) => ({ hora: `${String(h).padStart(2, '0')}h`, asistencias }))
    .filter((h) => h.hora >= '06h' && h.hora <= '22h')

  const todayParts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit', day: '2-digit' }).formatToParts(now)
  const todayKey = `${todayParts.find(p => p.type === 'month')?.value}/${todayParts.find(p => p.type === 'day')?.value}`
  const attendancesToday = perDay.get(todayKey) ?? 0
  
  const yesterday = new Date(now.getTime() - 86400000)
  const yesterdayParts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit', day: '2-digit' }).formatToParts(yesterday)
  const yesterdayKey = `${yesterdayParts.find(p => p.type === 'month')?.value}/${yesterdayParts.find(p => p.type === 'day')?.value}`
  const attendancesYesterday = perDay.get(yesterdayKey) ?? 0

  // Distribuciones
  const statusData = membersByStatus
    .map((g) => ({ name: STATUS_LABEL[g.status] ?? g.status, value: g._count._all }))
    .sort((a, b) => b.value - a.value)

  const planCount = new Map<string, number>()
  for (const m of activeMemberships) planCount.set(m.plan.name, (planCount.get(m.plan.name) ?? 0) + 1)
  const planData = Array.from(planCount.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const methodData = Array.from(methodTotals.entries())
    .map(([m, value]) => ({ name: METHOD_LABEL[m] ?? m, value }))
    .sort((a, b) => b.value - a.value)

  const actCount = new Map<string, { clases: number; reservas: number }>()
  for (const s of schedules30) {
    const cur = actCount.get(s.activity.name) ?? { clases: 0, reservas: 0 }
    cur.clases += 1
    cur.reservas += s._count.bookings
    actCount.set(s.activity.name, cur)
  }
  const topActivities = Array.from(actCount.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, 5)
  const maxReservas = Math.max(1, ...topActivities.map((a) => a.reservas))

  const kpis = [
    { label: 'Clientes activos', value: String(activeCount), sub: `${totalMembers} en total · ${newMembersMonth} nuevos este mes`, trend: variation(newMembersMonth, newMembersPrev), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Recaudación del mes', value: ars(revenueThisMonth), sub: 'vs mes anterior', trend: variation(revenueThisMonth, revenuePrevMonth), icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Ingresos hoy', value: String(attendancesToday), sub: `${attendancesYesterday} ayer`, trend: variation(attendancesToday, attendancesYesterday), icon: Scan, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Membresías vigentes', value: String(activeMemberships.length), sub: `${expiringSoon.length} vencen en 7 días · ${rutinasActivas} rutinas activas`, trend: null, icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Métricas y visualizaciones avanzadas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{k.label}</p>
                <p className={`text-2xl font-bold mt-2 ${k.color}`}>{k.value}</p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Trend value={k.trend} />
                  <span className="text-xs text-slate-400">{k.sub}</span>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${k.bg}`}>
                <k.icon size={20} className={k.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recaudación + estado de clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Recaudación" subtitle="Últimos 6 meses · pagos completados" className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </Card>
        <Card title="Estado de clientes" subtitle="Distribución actual">
          <DonutChart data={statusData} />
        </Card>
      </div>

      {/* Asistencia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Ingresos diarios" subtitle="Últimos 30 días" className="lg:col-span-2">
          <AttendanceChart data={attendanceData} />
        </Card>
        <Card title="Horarios pico" subtitle="Ingresos por hora · últimos 30 días">
          <HoursChart data={hoursData} />
        </Card>
      </div>

      {/* Planes, métodos, actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Planes más elegidos" subtitle="Membresías vigentes">
          {planData.length ? <DonutChart data={planData} /> : <p className="text-sm text-slate-400">Sin datos</p>}
        </Card>
        <Card title="Medios de pago" subtitle="Pagos del mes">
          {methodData.length ? <DonutChart data={methodData} /> : <p className="text-sm text-slate-400">Sin pagos este mes</p>}
        </Card>
        <Card title="Actividades más reservadas" subtitle="Últimos 30 días">
          {topActivities.length ? (
            <ul className="space-y-3">
              {topActivities.map((a) => (
                <li key={a.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-slate-700"><Dumbbell size={14} className="text-slate-400" />{a.name}</span>
                    <span className="text-slate-500 tabular-nums">{a.reservas} reservas · {a.clases} clases</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(a.reservas / maxReservas) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Sin clases en el período</p>}
        </Card>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Vencen en los próximos 7 días" subtitle="Oportunidad de renovación">
          {expiringSoon.length ? (
            <ul className="divide-y divide-slate-100">
              {expiringSoon.map((m) => (
                <li key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{m.member.firstName} {m.member.lastName}</p>
                    <p className="text-xs text-slate-500">{m.plan.name}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full shrink-0">
                    <Clock size={12} />{m.endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Ninguna membresía vence esta semana</p>}
          <Link href="/admin/planes" className="inline-block mt-3 text-sm text-blue-600 hover:underline">Ver planes y membresías →</Link>
        </Card>

        <Card title="Últimos pagos" subtitle="Movimientos recientes">
          {recentPayments.length ? (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{p.member.firstName} {p.member.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{p.concept}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 tabular-nums">{ars(Number(p.amount))}</p>
                    <p className="text-xs text-slate-400">{p.createdAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Sin pagos registrados</p>}
          <Link href="/admin/pagos" className="inline-block mt-3 text-sm text-blue-600 hover:underline">Ver todos los pagos →</Link>
        </Card>
      </div>
    </div>
  )
}