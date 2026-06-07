'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  maxCapacity: number
  availableSpots: number
  isFull: boolean
  activity: {
    name: string
    color: string | null
  }
  bookings: {
    id: string
  }[]
}

interface Booking {
  id: string
  scheduleId: string
  status: string
  schedule: {
    date: string
    startTime: string
    endTime: string
    activity: {
      name: string
    }
  }
}

export default function TurnosPage() {
  const { user, isLoaded } = useUser()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState<string>('')

  // Obtener memberId desde Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as { memberId?: string }
      if (metadata.memberId) {
        setMemberId(metadata.memberId)
      }
    }
  }, [isLoaded, user])

  useEffect(() => {
    if (memberId) {
      fetchAvailableClasses()
      fetchMyBookings()
    }
  }, [selectedDate, memberId])

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch(`/api/turnos/disponibles?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`/api/turnos?memberId=${memberId}`)
      if (response.ok) {
        const data = await response.json()
        setMyBookings(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const bookClass = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, scheduleId }),
      })

      if (response.ok) {
        fetchAvailableClasses()
        fetchMyBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al reservar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error de conexión')
    }
  }

  const cancelBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/turnos?id=${bookingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAvailableClasses()
        fetchMyBookings()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const isBooked = (scheduleId: string) => {
    return myBookings.some(b => b.scheduleId === scheduleId && b.status === 'CONFIRMED')
  }

  if (!isLoaded) {
    return <div className="p-4">Cargando...</div>
  }

  if (!user) {
    return <div className="p-4">Debes iniciar sesión</div>
  }

  if (!memberId) {
    return (
      <div className="p-4">
        <p className="text-slate-600">Tu cuenta no está vinculada a un cliente. Contactá al administrador.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="p-4">Cargando clases...</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Reservar Turno</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
        />
      </div>

      {/* Mis reservas */}
      {myBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Mis Reservas</h3>
          <div className="space-y-2">
            {myBookings
              .filter(b => b.status === 'CONFIRMED')
              .map(booking => (
                <div key={booking.id} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{booking.schedule.activity.name}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(booking.schedule.date).toLocaleDateString('es-AR')} · {booking.schedule.startTime} - {booking.schedule.endTime}
                    </p>
                  </div>
                  <button
                    onClick={() => cancelBooking(booking.id)}
                    className="text-red-600 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Clases disponibles */}
      <h3 className="text-lg font-semibold mb-2">Clases Disponibles</h3>
      
      {schedules.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No hay clases disponibles para esta fecha</p>
      ) : (
        <div className="space-y-3">
          {schedules.map(schedule => {
            const booked = isBooked(schedule.id)
            
            return (
              <div 
                key={schedule.id} 
                className={`bg-white border rounded-lg p-4 ${
                  booked ? 'border-green-400 bg-green-50' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold">{schedule.activity.name}</h4>
                      {booked && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Reservado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    {schedule.room && (
                      <p className="text-sm text-slate-500">Sala: {schedule.room}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      schedule.isFull ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {schedule.availableSpots} cupos
                    </p>
                  </div>
                </div>

                {!booked && (
                  <button
                    onClick={() => bookClass(schedule.id)}
                    disabled={schedule.isFull}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium ${
                      schedule.isFull
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {schedule.isFull ? 'Completa' : 'Reservar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}