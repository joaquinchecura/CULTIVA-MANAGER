export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { ArrowLeft, Calendar, Clock, Dumbbell, Plus } from 'lucide-react'
import Link from 'next/link'
import AsignarClasePersonal from './AsignarClasePersonal'

export default async function ClienteClasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: 'CONFIRMED' },
        include: { schedule: { include: { activity: true } } },
        orderBy: { schedule: { date: 'asc' } },
      },
    },
  })

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  const activities = await prisma.activity.findMany({ where: { isActive: true } })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/clientes/${id}`} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clases de {member.firstName}</h1>
          <p className="text-slate-500">DNI: {member.dni}</p>
        </div>
      </div>

      {/* Clases asignadas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Dumbbell size={18} className="text-blue-600" />
            Clases Reservadas
          </h3>
          <span className="text-sm text-slate-500">{member.bookings.length} clases</span>
        </div>

        {member.bookings.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="mx-auto mb-2 text-slate-300" size={40} />
            <p>Sin clases asignadas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {member.bookings.map((b) => (
              <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{b.schedule.activity.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(b.schedule.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' • '}
                    {b.schedule.startTime} - {b.schedule.endTime}
                  </p>
                  {b.schedule.room && <p className="text-xs text-slate-400">Sala: {b.schedule.room}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  b.schedule.maxCapacity === 1 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {b.schedule.maxCapacity === 1 ? 'Personalizada' : 'Grupal'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para asignar clase personalizada */}
      <AsignarClasePersonal memberId={member.id} activities={activities} />
    </div>
  )
}