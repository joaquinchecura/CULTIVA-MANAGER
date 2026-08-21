'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  X, Clock, MapPin, Users, CheckCircle2, XCircle,
  UserX, TrendingUp, Loader2, Calendar as CalendarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BookingMember {
  id: string
  firstName: string
  lastName: string
  dni: string
  photoUrl: string | null
}

interface Booking {
  id: string
  status: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'
  member: BookingMember
}

interface ScheduleDetail {
  id: string
  date: string
  startTime: string
  endTime: string
  room: string | null
  maxCapacity: number
  isCancelled: boolean
  activity: { name: string; color: string | null }
  bookings: Booking[]
  activityStats: { sampledClasses: number; attendanceRate: number | null }
}

function getStatus(schedule: ScheduleDetail) {
  const [y, m, d] = schedule.date.split('T')[0].split('-').map(Number)
  const [eh, em] = schedule.endTime.split(':').map(Number)
  const end = new Date(y, m - 1, d, eh, em)

  if (schedule.isCancelled) return 'cancelada'
  if (end.getTime() < Date.now()) return 'finalizada'
  const occupancy = schedule.bookings.filter(b => b.status !== 'CANCELLED').length / schedule.maxCapacity
  if (occupancy >= 1) return 'completa'
  if (occupancy >= 0.7) return 'casi-llena'
  return 'disponible'
}

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  disponible:   { label: 'Disponible', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  'casi-llena': { label: 'Casi llena', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  completa:     { label: 'Completa',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelada:    { label: 'Cancelada',  badge: 'bg-red-50 text-red-700 border-red-200' },
  finalizada:   { label: 'Finalizada', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function ScheduleDetailModal({
  scheduleId,
  onClose,
  onChanged,
}: {
  scheduleId: string
  onClose: () => void
  onChanged?: () => void
}) {
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function fetchDetail() {
    setLoading(true)
    try {
      const res = await fetch(`/api/agenda/${scheduleId}`)
      if (res.ok) setSchedule(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [scheduleId])

  async function updateBookingStatus(bookingId: string, status: string) {
    setUpdatingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchDetail()
        onChanged?.()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm('¿Cancelar la reserva de este cliente?')) return
    setUpdatingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchDetail()
        onChanged?.()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const status = schedule ? getStatus(schedule) : null
  const isFinalized = status === 'finalizada'
  const activeBookings = schedule?.bookings.filter(b => b.status !== 'CANCELLED') ?? []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {loading || !schedule ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-lg font-bold text-slate-900">{schedule.activity.name}</h3>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_LABEL[status!].badge)}>
                      {STATUS_LABEL[status!].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <CalendarIcon size={13} />
                      {new Date(schedule.date).toLocaleDateString('es-AR', {
                        weekday: 'long', day: 'numeric', month: 'long',
                        timeZone: 'America/Argentina/Buenos_Aires',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} /> {schedule.startTime.slice(0,5)} - {schedule.endTime.slice(0,5)}
                    </span>
                    {schedule.room && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {schedule.room}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users size={14} className="text-slate-400" />
                  <span className="font-semibold text-slate-900">{activeBookings.length}</span>
                  <span className="text-slate-400">/ {schedule.maxCapacity} anotados</span>
                </div>
                {schedule.activityStats.attendanceRate !== null && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <TrendingUp size={14} className="text-violet-500" />
                    <span className="font-semibold text-slate-900">{schedule.activityStats.attendanceRate}%</span>
                    <span className="text-slate-400">asistencia histórica</span>
                  </div>
                )}
              </div>
            </div>

            {/* Roster */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {isFinalized ? 'Marcar asistencia' : 'Clientes anotados'}
              </p>

              {activeBookings.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Sin clientes anotados</p>
              ) : (
                <div className="space-y-2">
                  {activeBookings.map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs shrink-0">
                          {b.member.firstName[0]}{b.member.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {b.member.firstName} {b.member.lastName}
                          </p>
                          <p className="text-xs text-slate-400">DNI {b.member.dni}</p>
                        </div>
                      </div>

                      {isFinalized ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateBookingStatus(b.id, 'COMPLETED')}
                            disabled={updatingId === b.id}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              b.status === 'COMPLETED'
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                            )}
                            title="Asistió"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => updateBookingStatus(b.id, 'NO_SHOW')}
                            disabled={updatingId === b.id}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              b.status === 'NO_SHOW'
                                ? 'bg-red-500 text-white'
                                : 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                            )}
                            title="No asistió"
                          >
                            <UserX size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            Confirmado
                          </span>
                          <button
                            onClick={() => cancelBooking(b.id)}
                            disabled={updatingId === b.id}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Cancelar reserva"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <Link
                href={`/admin/estadisticas/clases?activityId=${schedule.id}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <TrendingUp size={13} /> Ver estadísticas completas
              </Link>
              <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}