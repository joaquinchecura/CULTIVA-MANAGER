export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { DollarSign, CreditCard, Calendar, TrendingUp, Users, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function PagosGlobalesPage() {
  const [payments, totalStats] = await Promise.all([
    prisma.payment.findMany({
      include: { member: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  // Agrupar por método
  const porMetodo = payments.reduce((acc, p) => {
    const metodo = p.method
    if (!acc[metodo]) acc[metodo] = { count: 0, total: 0 }
    acc[metodo].count++
    acc[metodo].total += Number(p.amount)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Pagos de hoy
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const pagosHoy = payments.filter(p => new Date(p.createdAt) >= hoy)
  const totalHoy = pagosHoy.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pagos Recibidos</h2>
        <p className="text-slate-500 mt-1">Todos los pagos del gimnasio</p>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-xs text-slate-500">Total recaudado</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${Number(totalStats._sum.amount || 0).toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={16} className="text-blue-600" />
            <span className="text-xs text-slate-500">Total pagos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalStats._count}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-purple-600" />
            <span className="text-xs text-slate-500">Hoy</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalHoy.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-slate-500">{pagosHoy.length} pagos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-orange-600" />
            <span className="text-xs text-slate-500">Promedio por pago</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalStats._count > 0 
              ? Math.round(Number(totalStats._sum.amount || 0) / totalStats._count).toLocaleString('es-AR')
              : '0'}
          </p>
        </div>
      </div>

      {/* Desglose por método */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'CASH', label: 'Efectivo', color: 'bg-green-50 text-green-700 border-green-200' },
          { key: 'TRANSFER', label: 'Transferencia', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { key: 'MERCADOPAGO', label: 'MercadoPago', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
          { key: 'CARD', label: 'Tarjeta', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { key: 'OTHER', label: 'Otro', color: 'bg-slate-50 text-slate-700 border-slate-200' },
        ].map((metodo) => {
          const data = porMetodo[metodo.key]
          return (
            <div key={metodo.key} className={`border rounded-xl p-4 ${metodo.color}`}>
              <p className="text-sm font-medium">{metodo.label}</p>
              <p className="text-xl font-bold mt-1">
                ${data ? data.total.toLocaleString('es-AR') : '0'}
              </p>
              <p className="text-xs opacity-70">{data ? data.count : 0} pagos</p>
            </div>
          )
        })}
      </div>

      {/* Lista de pagos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Últimos pagos</h3>
          <span className="text-sm text-slate-500">Últimos 100 registros</span>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CreditCard className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin pagos registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Concepto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Método</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(p.createdAt).toLocaleDateString('es-AR')}
                    <span className="block text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link 
                      href={`/admin/clientes/${p.member.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-blue-600"
                    >
                      {p.member.firstName} {p.member.lastName}
                    </Link>
                    <span className="block text-xs text-slate-500">DNI: {p.member.dni}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">{p.concept}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {p.method === 'CASH' ? '💵 Efectivo' :
                     p.method === 'TRANSFER' ? '🏦 Transferencia' :
                     p.method === 'MERCADOPAGO' ? '📱 MercadoPago' :
                     p.method === 'CARD' ? '💳 Tarjeta' : '📝 Otro'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    ${Number(p.amount).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.status === 'COMPLETED' ? '✓ Completado' :
                       p.status === 'PENDING' ? '⏳ Pendiente' :
                       p.status === 'FAILED' ? '✕ Fallido' : '↩ Reembolsado'}
                    </span>
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