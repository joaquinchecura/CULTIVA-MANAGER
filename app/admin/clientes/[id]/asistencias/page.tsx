export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

// Next.js 15: params es Promise
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
          <p className="text-slate-500">{member.firstName} {member.lastName} — DNI: {member.dni}</p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Lista */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {member.attendances.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin asistencias registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Hora</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {member.attendances.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {new Date(a.entryTime).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(a.entryTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      a.status === 'ALLOWED' 
                        ? 'bg-green-100 text-green-700' 
                        : a.status === 'DENIED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {a.status === 'ALLOWED' ? 'Permitido' : a.status === 'DENIED' ? 'Denegado' : 'Advertencia'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {a.qrToken.slice(0, 8)}...
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