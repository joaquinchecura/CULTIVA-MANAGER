export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { Users, Clock, MapPin, Plus, TrendingUp, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSessionLabel } from '@/lib/pt-session'
import PTSessionRow from '@/components/agenda-pt/PTSessionRow'

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'border-l-blue-500 bg-blue-50/40',
  COMPLETED: 'border-l-emerald-500 bg-emerald-50/40',
  CANCELLED: 'border-l-red-500 bg-red-50/40 opacity-60',
  NO_SHOW: 'border-l-amber-500 bg-amber-50/40',
}

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  CONFIRMED: { label: 'Reservada', badge: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Realizada', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelada', badge: 'bg-red-100 text-red-700' },
  NO_SHOW:   { label: 'Ausente',   badge: 'bg-amber-100 text-amber-700' },
}

export default async function AgendaPTPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const params = await searchParams
  const baseDate = params.week ? new Date(params.week) : new Date()
  const start = startOfWeek(baseDate, { weekStartsOn: 1 })
  const end = endOfWeek(baseDate, { weekStartsOn: 1 })

  const schedules = await prisma.schedule.findMany({
    where: {
      maxCapacity: 1,
      date: { gte: start, lte: end },
    },
    include: {
      activity: true,
      bookings: {
        include: { member: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Enriquecer con el label de sesión
  const enriched = await Promise.all(
    schedules.map(async (s) => {
      const booking = s.bookings[0]
      const sessionInfo = booking
        ? await getSessionLabel(booking.member.id, s.date)
        : null
      return { schedule: s, booking, sessionInfo }
    })
  )

  const byDay = new Map<string, typeof enriched>()
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i)
    byDay.set(format(day, 'yyyy-MM-dd'), [])
  }
  enriched.forEach(item => {
    const key = format(item.schedule.date, 'yyyy-MM-dd')
    if (byDay.has(key)) byDay.get(key)!.push(item)
  })

  const prevWeek = format(addDays(start, -7), 'yyyy-MM-dd')
  const nextWeek = format(addDays(start, 7), 'yyyy-MM-dd')

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCircle2 size={24} className="text-blue-600" />
            Agenda Personal Trainer
          </h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            {format(start, "d 'de' MMMM", { locale: es })} — {format(end, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/estadisticas/personal">
            <Button variant="outline" size="sm" className="gap-1.5">
              <TrendingUp size={14} /> Estadísticas
            </Button>
          </Link>
          <Link href="/admin/agenda-pt/nueva">
            <Button size="sm" className="gap-1.5">
              <Plus size={14} /> Nueva sesión
            </Button>
          </Link>
        </div>
      </div>

      {/* Navegación de semana */}
      <div className="flex items-center gap-2">
        <Link href={`/admin/agenda-pt?week=${prevWeek}`}>
          <Button variant="outline" size="sm">← Semana anterior</Button>
        </Link>
        <Link href="/admin/agenda-pt">
          <Button variant="outline" size="sm">Hoy</Button>
        </Link>
        <Link href={`/admin/agenda-pt?week=${nextWeek}`}>
          <Button variant="outline" size="sm">Semana siguiente →</Button>
        </Link>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Reservada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Realizada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Cancelada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Ausente</span>
      </div>

      {/* Días */}
      <div className="space-y-4">
        {Array.from(byDay.entries()).map(([dateKey, items]) => (
          <div key={dateKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700 capitalize">
                {format(new Date(dateKey + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-4 text-xs text-slate-400">Sin sesiones</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {items.map(({ schedule, booking, sessionInfo }) => (
                  <PTSessionRow
                    key={schedule.id}
                    bookingId={booking?.id ?? null}
                    memberName={booking ? `${booking.member.firstName} ${booking.member.lastName}` : 'Sin cliente'}
                    activityName={schedule.activity.name}
                    startTime={schedule.startTime}
                    endTime={schedule.endTime}
                    room={schedule.room}
                    status={booking?.status ?? 'CANCELLED'}
                    sessionInfo={sessionInfo}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}