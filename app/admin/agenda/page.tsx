'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
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
  activity: {
    name: string
    color: string | null
  }
  bookings: {
    id: string
  }[]
}

export default function AgendaPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>(Views.WEEK)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Usar useCallback para que la función siempre tenga los valores actualizados
  const fetchSchedules = useCallback(async (currentView: View, currentDateValue: Date) => {
    setLoading(true)
    try {
      let startDate: string, endDate: string
      
      if (currentView === Views.MONTH) {
        startDate = format(startOfMonth(currentDateValue), 'yyyy-MM-dd')
        endDate = format(endOfMonth(currentDateValue), 'yyyy-MM-dd')
      } else if (currentView === Views.WEEK) {
        const start = startOfWeek(currentDateValue, { locale: es })
        startDate = format(start, 'yyyy-MM-dd')
        endDate = format(addDays(start, 6), 'yyyy-MM-dd')
      } else {
        startDate = format(currentDateValue, 'yyyy-MM-dd')
        endDate = format(currentDateValue, 'yyyy-MM-dd')
      }

      console.log('Fetching:', { view: currentView, startDate, endDate }) // Para debug

      const response = await fetch(`/api/agenda?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Received:', data.length, 'schedules') // Para debug
        setSchedules(data)
      } else {
        console.error('Error response:', await response.text())
        setSchedules([])
      }
    } catch (error) {
      console.error('Error fetching:', error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, []) // Sin dependencias, usa los parámetros

  // Efecto que se dispara cuando cambia view o currentDate
  useEffect(() => {
    fetchSchedules(view, currentDate)
  }, [view, currentDate, fetchSchedules])

  const events = useMemo(() => {
    return schedules.map((schedule: Schedule) => {
      const [startHour, startMin] = schedule.startTime.split(':').map(Number)
      const [endHour, endMin] = schedule.endTime.split(':').map(Number)
      
      const dateStr = schedule.date.split('T')[0]
      const [year, month, day] = dateStr.split('-').map(Number)
      
      const start = new Date(year, month - 1, day, startHour, startMin, 0)
      const end = new Date(year, month - 1, day, endHour, endMin, 0)

      return {
        id: schedule.id,
        title: `${schedule.activity.name} ${schedule.isCancelled ? '(CANCELADA)' : ''} - ${schedule.bookings.length}/${schedule.maxCapacity}`,
        start,
        end,
        resource: schedule,
      }
    })
  }, [schedules])

  const eventStyleGetter = (event: any) => {
    const schedule = event.resource as Schedule
    const isFull = schedule.bookings.length >= schedule.maxCapacity
    const isCancelled = schedule.isCancelled
    
    let backgroundColor = schedule.activity.color || '#3B82F6'
    if (isCancelled) backgroundColor = '#EF4444'
    else if (isFull) backgroundColor = '#F59E0B'

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: isCancelled ? 0.7 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px',
      }
    }
  }

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          Hoy
        </button>
        <button onClick={() => onNavigate('PREV')} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">
          ←
        </button>
        <button onClick={() => onNavigate('NEXT')} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">
          →
        </button>
        <span className="text-lg font-semibold ml-2">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button 
            onClick={() => onView('day')}
            className={`px-3 py-1 rounded-md text-sm ${view === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
          >
            Día
          </button>
          <button 
            onClick={() => onView('week')}
            className={`px-3 py-1 rounded-md text-sm ${view === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
          >
            Semana
          </button>
          <button 
            onClick={() => onView('month')}
            className={`px-3 py-1 rounded-md text-sm ${view === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}
          >
            Mes
          </button>
        </div>
        <Link 
          href="/admin/agenda/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Nueva Clase
        </Link>
      </div>
    </div>
  )

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Agenda</h2>
      
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Completa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Cancelada</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={(newView: View) => {
            console.log('Changing view to:', newView)
            setView(newView)
          }}
          date={currentDate}
          onNavigate={(newDate: Date) => {
            console.log('Navigating to:', newDate)
            setCurrentDate(newDate)
          }}
          eventPropGetter={eventStyleGetter}
          components={{ toolbar: CustomToolbar }}
          views={['day', 'week', 'month']}
          min={new Date(0, 0, 0, 7, 0)}
          max={new Date(0, 0, 0, 22, 0)}
          formats={{
            timeGutterFormat: 'HH:mm',
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
          }}
          onSelectEvent={(event) => {
            window.location.href = `/admin/agenda/${event.id}`
          }}
        />
      </div>
    </div>
  )
}