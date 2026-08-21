'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import {
  Calendar as CalendarIcon, Plus, Filter, Clock, Users, MapPin,
  X, ChevronLeft, ChevronRight, CalendarCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import ScheduleDetailModal from '@/components/agenda/ScheduleDetailModal'

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // ← semana desde lunes
  getDay,
  locales,
})

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  maxCapacity: number
  isCancelled: boolean
  isHoliday: boolean
  activity: {
    id: string
    name: string
    color: string | null
    defaultDuration: number
  }
  bookings: {
    id: string
    memberId: string
  }[]
  _count?: { bookings: number }
}

type SideView = 'none' | 'day-detail' | 'upcoming'

// ── Estados y colores ────────────────────────────────────────────────────
// azul disponible · naranja casi llena · amarillo completa · rojo cancelada · verde finalizada

function getScheduleEnd(schedule: Schedule) {
  const dateStr = schedule.date.split('T')[0]
  const [year, month, day] = dateStr.split('-').map(Number)
  const [endHour, endMin] = schedule.endTime.split(':').map(Number)
  return new Date(year, month - 1, day, endHour, endMin, 0)
}

function getScheduleStatus(schedule: Schedule) {
  if (schedule.isCancelled) return 'cancelada'
  if (getScheduleEnd(schedule).getTime() < Date.now()) return 'finalizada'
  const occupancy = schedule.bookings.length / schedule.maxCapacity
  if (occupancy >= 1) return 'completa'
  if (occupancy >= 0.7) return 'casi-llena'
  return 'disponible'
}

const STATUS_CONFIG: Record<string, { color: string; label: string; badge: string }> = {
  disponible:  { color: '#3B82F6', label: 'Disponible', badge: 'bg-blue-50 text-blue-600' },
  'casi-llena': { color: '#F97316', label: 'Casi llena', badge: 'bg-orange-50 text-orange-600' },
  completa:    { color: '#EAB308', label: 'Completa',   badge: 'bg-amber-50 text-amber-700' },
  cancelada:   { color: '#EF4444', label: 'Cancelada',  badge: 'bg-red-50 text-red-600' },
  finalizada:  { color: '#22C55E', label: 'Finalizada', badge: 'bg-emerald-50 text-emerald-600' },
}

export default function AgendaPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sideView, setSideView] = useState<SideView>('upcoming')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [filterActivity, setFilterActivity] = useState<string>('all')
  const [filterRoom, setFilterRoom] = useState<string>('all')
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)

  const fetchSchedules = useCallback(async (currentView: View, currentDateValue: Date) => {
    setLoading(true)
    try {
      let startDate: string, endDate: string

      if (currentView === Views.MONTH) {
        startDate = format(startOfMonth(currentDateValue), 'yyyy-MM-dd')
        endDate = format(endOfMonth(currentDateValue), 'yyyy-MM-dd')
      } else if (currentView === Views.WEEK) {
        const start = startOfWeek(currentDateValue, { weekStartsOn: 1 }) // ← lunes
        startDate = format(start, 'yyyy-MM-dd')
        endDate = format(addDays(start, 6), 'yyyy-MM-dd')
      } else {
        startDate = format(currentDateValue, 'yyyy-MM-dd')
        endDate = format(currentDateValue, 'yyyy-MM-dd')
      }

      const response = await fetch(`/api/agenda?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Error fetching:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules(view, currentDate)
  }, [view, currentDate, fetchSchedules])

  const activities = useMemo(() => {
    const map = new Map<string, string>()
    schedules.forEach(s => map.set(s.activity.id, s.activity.name))
    return Array.from(map.entries())
  }, [schedules])

  const rooms = useMemo(() => {
    const set = new Set<string>()
    schedules.forEach(s => { if (s.room) set.add(s.room) })
    return Array.from(set)
  }, [schedules])

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchesActivity = filterActivity === 'all' || s.activity.id === filterActivity
      const matchesRoom = filterRoom === 'all' || s.room === filterRoom
      return matchesActivity && matchesRoom
    })
  }, [schedules, filterActivity, filterRoom])

  const events = useMemo(() => {
    return filteredSchedules.map((schedule) => {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number)
      const [endHour, endMin] = schedule.endTime.split(':').map(Number)

      const dateStr = schedule.date.split('T')[0]
      const [year, month, day] = dateStr.split('-').map(Number)

      const start = new Date(year, month - 1, day, startHour, startMin, 0)
      const end = new Date(year, month - 1, day, endHour, endMin, 0)

      return {
        id: schedule.id,
        title: `${schedule.activity.name}`,
        start,
        end,
        resource: schedule,
      }
    })
  }, [filteredSchedules])

  const eventStyleGetter = (event: any) => {
    const schedule = event.resource as Schedule
    const status = getScheduleStatus(schedule)
    const backgroundColor = STATUS_CONFIG[status].color

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: status === 'cancelada' ? 0.65 : status === 'finalizada' ? 0.75 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        fontWeight: 500,
        padding: '4px 8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }
    }
  }

  const upcomingClasses = useMemo(() => {
    const now = new Date()
    return schedules
      .filter(s => !s.isCancelled && new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)
  }, [schedules])

  const dayClasses = useMemo(() => {
    if (!selectedDay) return []
    return schedules.filter(s => isSameDay(new Date(s.date), selectedDay))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [schedules, selectedDay])

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')} className="gap-1">
          <CalendarCheck size={14} /> Hoy
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('PREV')}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('NEXT')}>
          <ChevronRight size={16} />
        </Button>
        <span className="text-lg font-bold text-slate-900 ml-2 capitalize">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => onView('day')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Día
          </button>
          <button
            onClick={() => onView('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Semana
          </button>
          <button
            onClick={() => onView('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Mes
          </button>
        </div>
        <Link href="/admin/agenda/nuevo">
          <Button size="sm" className="gap-1">
            <Plus size={14} /> Nueva
          </Button>
        </Link>
      </div>
    </div>
  )

  const CustomEvent = ({ event }: any) => {
    const s = event.resource as Schedule
    return (
      <div className="h-full flex flex-col justify-center gap-0.5">
        <span className="font-medium truncate">{event.title}</span>
        <span className="text-[10px] opacity-90 truncate">
          {s.room ? `📍 ${s.room} · ` : ''}{s.bookings.length}/{s.maxCapacity}
        </span>
      </div>
    )
  }

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedDay(slotInfo.start)
    setSideView('day-detail')
  }

  const handleSelectEvent = (event: any) => {
    setSelectedScheduleId(event.id)
  }

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon size={24} className="text-blue-600" />
            Agenda
          </h2>
          <p className="text-slate-500 mt-1">Programación de clases y reservas</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/agenda/nuevo">
            <Button className="gap-2">
              <Plus size={16} /> Nueva Clase
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros + leyenda */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl p-3">
        <Filter size={16} className="text-slate-400" />
        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="all">Todas las actividades</option>
          {activities.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        {rooms.length > 0 && (
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
          >
            <option value="all">Todas las salas</option>
            {rooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-4 ml-auto text-xs text-slate-500 flex-wrap">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </span>
          ))}
        </div>
      </div>

      {/* Layout principal: Calendario + Sidebar */}
      <div className="flex gap-4">
        {/* Calendario */}
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${sideView !== 'none' ? 'flex-1' : 'w-full'}`}>
          <Calendar
            localizer={localizer}
            culture="es"
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 780 }}
            view={view}
            onView={(newView: View) => setView(newView)}
            date={currentDate}
            onNavigate={(newDate: Date) => setCurrentDate(newDate)}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent,
            }}
            views={['day', 'week', 'month']}
            min={new Date(0, 0, 0, 7, 0)}
            max={new Date(0, 0, 0, 22, 0)}
            formats={{
              timeGutterFormat: 'HH:mm',
              dayFormat: (date: Date) => format(date, 'EEE d', { locale: es }),
              weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
              monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: es }),
              dayHeaderFormat: (date: Date) => format(date, "EEEE d 'de' MMMM", { locale: es }),
              dayRangeHeaderFormat: ({ start, end }: any) =>
                `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
              eventTimeRangeFormat: ({ start, end }: any) =>
                `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
            }}
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              day: 'Día',
              week: 'Semana',
              month: 'Mes',
              noEventsInRange: 'No hay clases programadas',
              showMore: (total: number) => `+${total} más`,
            }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
          />
        </div>

               {/* Sidebar */}
               {sideView !== 'none' && (
          <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 capitalize">
                {sideView === 'day-detail' && selectedDay
                  ? format(selectedDay, 'EEEE d MMM', { locale: es })
                  : 'Próximas Clases'}
              </h3>
              <button
                onClick={() => setSideView('none')}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {sideView === 'day-detail' ? (
                dayClasses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sin clases este día</p>
                ) : (
                  dayClasses.map((s) => {
                    const status = getScheduleStatus(s)
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedScheduleId(s.id)}
                        className="w-full text-left block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 text-sm">{s.activity.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[status].badge}`}>
                            {status === 'cancelada' ? 'Cancelada' : `${s.bookings.length}/${s.maxCapacity}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock size={12} /> {s.startTime.slice(0,5)} - {s.endTime.slice(0,5)}</span>
                          {s.room && <span className="flex items-center gap-1"><MapPin size={12} /> {s.room}</span>}
                        </div>
                      </button>
                    )
                  })
                )
              ) : (
                upcomingClasses.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Sin clases próximas</p>
                ) : (
                  upcomingClasses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScheduleId(s.id)}
                      className="w-full text-left block p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 text-sm">{s.activity.name}</span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(s.date), 'dd/MM')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {s.startTime.slice(0,5)}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {s.bookings.length}/{s.maxCapacity}</span>
                        {s.room && <span className="flex items-center gap-1"><MapPin size={12} /> {s.room}</span>}
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        )}
      </div>

      {selectedScheduleId && (
        <ScheduleDetailModal
          scheduleId={selectedScheduleId}
          onClose={() => setSelectedScheduleId(null)}
          onChanged={() => fetchSchedules(view, currentDate)}
        />
      )}
    </div>
  )
}