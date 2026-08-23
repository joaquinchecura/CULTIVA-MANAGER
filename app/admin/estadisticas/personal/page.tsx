export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, CheckCircle2, UserX, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function EstadisticasPersonalPage() {
  const bookings = await prisma.booking.findMany({
    where: { schedule: { activity: { type: 'PERSONAL' } } },
    include: { member: true, schedule: true },
  })

  const byMember = new Map<string, {
    name: string
    completed: number
    noShow: number
    cancelled: number
  }>()

  bookings.forEach(b => {
    const key = b.memberId
    if (!byMember.has(key)) {
      byMember.set(key, { name: `${b.member.firstName} ${b.member.lastName}`, completed: 0, noShow: 0, cancelled: 0 })
    }
    const entry = byMember.get(key)!
    if (b.status === 'COMPLETED') entry.completed++
    if (b.status === 'NO_SHOW') entry.noShow++
    if (b.status === 'CANCELLED') entry.cancelled++
  })

  const memberStats = Array.from(byMember.values()).sort((a, b) => b.completed - a.completed)

  const totalCompleted = memberStats.reduce((s, m) => s + m.completed, 0)
  const totalNoShow = memberStats.reduce((s, m) => s + m.noShow, 0)
  const totalCancelled = memberStats.reduce((s, m) => s + m.cancelled, 0)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/agenda-pt">
          <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estadísticas Personal Trainer</h1>
          <p className="text-sm text-slate-500">Total histórico de sesiones</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="text-xs text-slate-500">Realizadas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalCompleted}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX size={15} className="text-amber-600" />
            <span className="text-xs text-slate-500">Ausencias</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalNoShow}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={15} className="text-red-600" />
            <span className="text-xs text-slate-500">Canceladas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalCancelled}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Por cliente</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {memberStats.map(m => (
            <div key={m.name} className="px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">{m.name}</p>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-600 font-semibold">{m.completed} ✓</span>
                <span className="text-amber-600">{m.noShow} ausente</span>
                <span className="text-red-500">{m.cancelled} cancelada</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}