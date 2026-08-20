export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import {
  Users,
  UserPlus,
  CreditCard,
  CalendarDays,
  Scan,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Datos reales de la base
  const [
    totalClientes,
    clientesNuevosMes,
    clientesPendientes,
    totalPagosMes,
    totalPagosMesAnterior,
    asistenciasHoy,
    asistenciasAyer,
    clasesHoy,
    clasesSemana,
    membresiasPorVencer,
    membresiasVencidas,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.member.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.attendance.count({
      where: {
        entryTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.attendance.count({
      where: {
        entryTime: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1)),
          lt: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.schedule.count({
      where: {
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        isCancelled: false,
      },
    }),
    prisma.schedule.count({
      where: {
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
        isCancelled: false,
      },
    }),
    prisma.membership.count({
      where: {
        endDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
        status: 'ACTIVE',
      },
    }),
    prisma.membership.count({
      where: {
        endDate: { lt: new Date() },
        status: 'ACTIVE',
      },
    }),
  ])

  const montoMes = Number(totalPagosMes._sum.amount || 0)
  const montoMesAnterior = Number(totalPagosMesAnterior._sum.amount || 0)
  const variacionPagos = montoMesAnterior > 0
    ? ((montoMes - montoMesAnterior) / montoMesAnterior * 100).toFixed(1)
    : '0'

  const variacionAsistencias = asistenciasAyer > 0
    ? ((asistenciasHoy - asistenciasAyer) / asistenciasAyer * 100).toFixed(1)
    : '0'

  // Cards principales (métricas clave)
  const metricCards = [
    {
      href: '/admin/clientes',
      label: 'Total Clientes',
      value: totalClientes,
      sublabel: `${clientesNuevosMes} nuevos este mes`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      trend: clientesNuevosMes > 0 ? 'up' : 'neutral' as const,
    },
    {
      href: '/admin/acceso',
      label: 'Asistencias Hoy',
      value: asistenciasHoy,
      sublabel: `${asistenciasAyer} ayer`,
      icon: Scan,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      trend: Number(variacionAsistencias) > 0 ? 'up' : Number(variacionAsistencias) < 0 ? 'down' : 'neutral' as const,
      trendValue: `${Math.abs(Number(variacionAsistencias))}%`,
    },
    {
      href: '/admin/pagos',
      label: 'Recaudación Mes',
      value: `$${montoMes.toLocaleString('es-AR')}`,
      sublabel: 'vs mes anterior',
      icon: CreditCard,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      trend: Number(variacionPagos) > 0 ? 'up' : Number(variacionPagos) < 0 ? 'down' : 'neutral' as const,
      trendValue: `${Math.abs(Number(variacionPagos))}%`,
    },
    {
      href: '/admin/clientes/vincular',
      label: 'Pendientes',
      value: clientesPendientes,
      sublabel: 'por aprobar',
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      trend: clientesPendientes > 0 ? 'up' : 'neutral' as const,
    },
  ]

  // Cards secundarias (alertas y acciones)
  const alertCards = [
    {
      href: '/admin/planes',
      label: 'Membresías por Vencer',
      value: membresiasPorVencer,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      alert: membresiasPorVencer > 0,
    },
    {
      href: '/admin/planes',
      label: 'Membresías Vencidas',
      value: membresiasVencidas,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      alert: membresiasVencidas > 0,
    },
  ]

  // Acciones rápidas
  const quickActions = [
    { href: '/admin/clientes/nuevo', label: 'Nuevo Cliente', icon: UserPlus, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { href: '/admin/rutinas/nueva', label: 'Nueva Rutina', icon: Activity, color: 'bg-slate-800 hover:bg-slate-900 text-white' },
    { href: '/admin/agenda', label: 'Ver Agenda', icon: CalendarDays, color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
    { href: '/admin/pagos', label: 'Registrar Pago', icon: CreditCard, color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
        <p className="text-slate-500 mt-1">Resumen de la actividad del gimnasio</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group bg-white p-5 rounded-xl border ${card.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {card.trend === 'up' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <ArrowUpRight size={12} />
                      {card.trendValue}
                    </span>
                  )}
                  {card.trend === 'down' && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                      <ArrowDownRight size={12} />
                      {card.trendValue}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{card.sublabel}</span>
                </div>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bg} shrink-0`}>
                <card.icon size={22} className={card.color} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alertas + Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertas */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Alertas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alertCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`flex items-center gap-4 p-4 rounded-xl border ${card.border} ${card.bg} ${card.alert ? 'animate-pulse' : ''} hover:shadow-md transition-all`}
              >
                <div className={`p-2.5 rounded-xl bg-white/80`}>
                  <card.icon size={22} className={card.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                {card.alert && (
                  <div className="ml-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Acciones Rápidas</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${action.color}`}
              >
                <action.icon size={18} />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas asistencias */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Últimas Asistencias</h3>
            <p className="text-xs text-slate-500 mt-0.5">Hoy</p>
          </div>
          <Link href="/admin/acceso" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver scanner →
          </Link>
        </div>
        <UltimasAsistencias />
      </div>
    </div>
  )
}

async function UltimasAsistencias() {
  const attendances = await prisma.attendance.findMany({
    orderBy: { entryTime: 'desc' },
    take: 5,
    include: { member: true },
  })

  if (attendances.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Scan size={32} className="mx-auto mb-3 text-slate-300" />
        <p>Sin asistencias registradas hoy</p>
        <p className="text-sm text-slate-400 mt-1">Usá el scanner para registrar entradas</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {attendances.map((a) => (
        <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {a.member.firstName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{a.member.firstName} {a.member.lastName}</p>
              <p className="text-xs text-slate-500">{a.member.dni}</p>
            </div>
          </div>
          <div className="text-right">
          <p className="text-xs text-slate-500">
  {new Date(a.entryTime).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
  {' · '}
  {new Date(a.entryTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${
              a.status === 'ALLOWED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {a.status === 'ALLOWED' ? '✓ Permitido' : '✗ Denegado'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}