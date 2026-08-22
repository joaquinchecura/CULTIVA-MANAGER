export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { TrendingUp, UserCircle2, Dumbbell, DollarSign, Users } from 'lucide-react'

export default async function EstadisticasPage() {
  const now = new Date()

  const [classesDictadas, ptSesiones] = await Promise.all([
    prisma.schedule.count({
      where: { isCancelled: false, date: { lt: now }, maxCapacity: { gt: 1 } },
    }),
    prisma.schedule.count({
      where: { isCancelled: false, date: { lt: now }, maxCapacity: 1 },
    }),
  ])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Estadísticas</h2>
        <p className="text-slate-500 mt-1">Análisis detallado del gimnasio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link
          href="/admin/estadisticas/clases"
          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Dumbbell size={26} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Clases grupales</h3>
          <p className="text-slate-500 mt-1 text-sm">
            {classesDictadas} clases dictadas · asistencia por actividad y por cliente
          </p>
        </Link>

        <Link
          href="/admin/estadisticas/personal"
          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-violet-200 transition-all group"
        >
          <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
            <UserCircle2 size={26} className="text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Personal Trainer</h3>
          <p className="text-slate-500 mt-1 text-sm">
            {ptSesiones} sesiones dictadas · asistencia por cliente
          </p>
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 opacity-60">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
            <Users size={26} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Crecimiento de clientes</h3>
          <p className="text-slate-400 mt-1 text-sm">Próximamente</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 opacity-60">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
            <DollarSign size={26} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Ingresos</h3>
          <p className="text-slate-400 mt-1 text-sm">Próximamente</p>
        </div>
      </div>
    </div>
  )
}