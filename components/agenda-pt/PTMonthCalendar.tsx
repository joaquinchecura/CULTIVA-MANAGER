'use client'

import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { es },
})

interface PTSchedule {
  id: string
  date: string
  startTime: string
  endTime: string
  activity: { name: string }
  bookings: {
    status: string
    member: { firstName: string; lastName: string }
  }[]
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: '#3B82F6',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
  NO_SHOW:   '#F59E0B',
}

export default function PTMonthCalendar({ schedules }: { schedules: PTSchedule[] }) {
  const router = useRouter()

  const events = schedules
    .filter(s => s.bookings.length > 0)
    .map(s => {
      const booking = s.bookings[0]
      const dateStr = s.date.split('T')[0]
      const [year, month, day] = dateStr.split('-').map(Number)
      const [sh, sm] = s.startTime.split(':').map(Number)
      const [eh, em] = s.endTime.split(':').map(Number)

      return {
        id: s.id,
        title: `${booking.member.firstName} ${booking.member.lastName[0]}. · ${s.activity.name}`,
        start: new Date(year, month - 1, day, sh, sm),
        end: new Date(year, month - 1, day, eh, em),
        resource: { status: booking.status, date: dateStr },
      }
    })

  function eventStyleGetter(event: any) {
    return {
      style: {
        backgroundColor: STATUS_COLOR[event.resource.status] || '#94A3B8',
        borderRadius: '6px',
        opacity: event.resource.status === 'CANCELLED' ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '11px',
        padding: '2px 6px',
      },
    }
  }

  function handleSelectEvent(event: any) {
    router.push(`/admin/agenda-pt?week=${event.resource.date}`)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <Calendar
        localizer={localizer}
        culture="es"
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 680 }}
        views={['month']}
        defaultView="month"
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleSelectEvent}
        formats={{
          weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
          monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
        }}
        messages={{
          today: 'Hoy',
          previous: 'Anterior',
          next: 'Siguiente',
          month: 'Mes',
          noEventsInRange: 'Sin sesiones este mes',
          showMore: (total: number) => `+${total} más`,
        }}
        popup
      />
    </div>
  )
}