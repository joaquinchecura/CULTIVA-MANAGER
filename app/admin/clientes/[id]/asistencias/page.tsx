export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ArrowLeft, Calendar, Clock, Smartphone, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function ClienteAsistenciasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      attendances: {
        orderBy: { entryTime: 'desc' },
      },
    },
  })

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asistencias</h1>
          <p className="text-slate-500">
            {member.firstName} {member.lastName} — {member.email} — DNI: {member.dni}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{member.attendances.length}</p>
          <p className="text-sm text-slate-500">Total asistencias</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-600">
            {member.attendances.filter(a => a.status === 'ALLOWED').length}
          </p>
          <p className="text-sm text-slate-500">Accesos permitidos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">
            {member.attendances.filter(a => a.status === 'DENIED').length}
          </p>
          <p className="text-sm text-slate-500">Accesos denegados</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {member.attendances.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin asistencias registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha y hora</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Dispositivo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Token</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {member.attendances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div>{member.firstName} {member.lastName}</div>
                    <div className="text-xs text-slate-400">{member.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(a.entryTime).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Argentina/Buenos_Aires',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {a.deviceBrand || a.deviceModel || a.deviceOS ? (
                      <div className="flex items-center gap-1">
                        <Smartphone size={14} className="text-slate-400" />
                        <span>
                          {[a.deviceBrand, a.deviceModel].filter(Boolean).join(' ') || 'Desconocido'}
                          {a.deviceOS && <span className="text-slate-400"> · {a.deviceOS}</span>}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin datos</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {a.qrToken.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === 'ALLOWED'
                          ? 'bg-green-100 text-green-700'
                          : a.status === 'DENIED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {a.status === 'ALLOWED' ? 'Permitido' : a.status === 'DENIED' ? 'Denegado' : 'Advertencia'}
                      </span>
                      {member.status !== 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle size={12} /> Membresía inactiva
                        </span>
                      )}
                    </div>
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