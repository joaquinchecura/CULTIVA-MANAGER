export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { 
  Users, UserPlus, CreditCard, Calendar, 
  Scan, AlertCircle, TrendingUp, Clock 
} from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Datos reales de la base
  const [
    totalClientes,
    clientesHoy,
    clientesPendientes,
    totalPagosMes,
    asistenciasHoy,
    clasesHoy,
    membresiasPorVencer,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
    }),
    prisma.member.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    }),
    prisma.attendance.count({
      where: {
        entryTime: { gte: new Date(new Date().setHours(0,0,0,0)) }
      }
    }),
    prisma.schedule.count({
      where: {
        date: new Date(new Date().setHours(0,0,0,0)),
        isCancelled: false
      }
    }),
    prisma.membership.count({
      where: {
        endDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Próximos 7 días
          gte: new Date()
        },
        status: 'ACTIVE'
      }
    }),
  ])

  const cards = [
    {
      href: '/admin/clientes',
      label: 'Total Clientes',
      value: totalClientes,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      href: '/admin/clientes/vincular',
      label: 'Pendientes de Aprobación',
      value: clientesPendientes,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      href: '/admin/acceso',
      label: 'Asistencias Hoy',
      value: asistenciasHoy,
      icon: Scan,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      href: '/admin/agenda',
      label: 'Clases Hoy',
      value: clasesHoy,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      href: '/admin/pagos',
      label: 'Recaudación del Mes',
      value: `$${Number(totalPagosMes._sum.amount || 0).toLocaleString('es-AR')}`,
      icon: CreditCard,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      href: '/admin/clientes',
      label: 'Membresías por Vencer',
      value: membresiasPorVencer,
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      href: '/admin/clientes/nuevo',
      label: 'Nuevo Cliente',
      value: '+',
      icon: UserPlus,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      href: '/admin/agenda',
      label: 'Agenda Diaria',
      value: '📅',
      icon: Calendar,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Panel de Control</h2>
        <p className="text-slate-500 mt-1">Resumen de la actividad del gimnasio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Últimas asistencias */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Últimas Asistencias</h3>
          <Link href="/admin/acceso" className="text-sm text-blue-600 hover:text-blue-700">
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
        <p>Sin asistencias registradas hoy</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {attendances.map((a) => (
        <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {a.member.firstName[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{a.member.firstName} {a.member.lastName}</p>
              <p className="text-xs text-slate-500">{a.member.dni}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {new Date(a.entryTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              a.status === 'ALLOWED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {a.status === 'ALLOWED' ? 'OK' : 'NO'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}