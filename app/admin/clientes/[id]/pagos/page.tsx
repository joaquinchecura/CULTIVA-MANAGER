export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ArrowLeft, CreditCard, DollarSign, Calendar } from 'lucide-react'
import Link from 'next/link'
import NuevoPago from './NuevoPago'

export default async function ClientePagosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  const totalPagado = member.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clientes/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos de {member.firstName}</h1>
          <p className="text-slate-500">DNI: {member.dni}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">${totalPagado.toLocaleString('es-AR')}</p>
          <p className="text-sm text-slate-500">Total pagado</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{member.payments.length}</p>
          <p className="text-sm text-slate-500">Pagos registrados</p>
        </div>
      </div>

      {/* Formulario nuevo pago */}
      <NuevoPago memberId={member.id} />

      {/* Historial */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Historial de pagos</h3>
        </div>
        {member.payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CreditCard className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin pagos registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Concepto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Método</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {member.payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {new Date(p.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.concept}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign size={14} />
                      {p.method === 'CASH' ? 'Efectivo' :
                       p.method === 'TRANSFER' ? 'Transferencia' :
                       p.method === 'MERCADOPAGO' ? 'MercadoPago' :
                       p.method === 'CARD' ? 'Tarjeta' : 'Otro'}
                    </span>
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
                      {p.status === 'COMPLETED' ? 'Completado' :
                       p.status === 'PENDING' ? 'Pendiente' :
                       p.status === 'FAILED' ? 'Fallido' : 'Reembolsado'}
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