'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  X, Clock, MapPin, Users, CheckCircle2, XCircle,
  UserX, TrendingUp, Loader2, Calendar as CalendarIcon,
  Pencil, Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

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
  activityId: string 
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
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ startTime: '', endTime: '', room: '' })

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

  async function cancelSchedule() {
    if (!confirm('¿Cancelar esta clase completa? Los clientes anotados quedarán notificados de la cancelación.')) return
    setUpdatingId('schedule')
    try {
      const res = await fetch(`/api/agenda/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCancelled: true }),
      })
      if (res.ok) {
        await fetchDetail()
        onChanged?.()
      }
    } finally {
      setUpdatingId(null)
    }
  }

  // Agregar función, junto a cancelSchedule:
function startEditing() {
  if (!schedule) return
  setEditForm({
    startTime: schedule.startTime.slice(0, 5),
    endTime: schedule.endTime.slice(0, 5),
    room: schedule.room || '',
  })
  setEditing(true)
}

async function saveEdit() {
  setUpdatingId('edit')
  try {
    const res = await fetch(`/api/agenda/${scheduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        room: editForm.room || null,
      }),
    })
    if (res.ok) {
      setEditing(false)
      await fetchDetail()
      onChanged?.()
    }
  } finally {
    setUpdatingId(null)
  }
}

  async function deleteSchedule() {
    const hasBookings = activeBookings.length > 0
    const msg = hasBookings
      ? `Esta clase tiene ${activeBookings.length} cliente(s) anotado(s). Eliminarla borra también sus reservas. ¿Continuar?`
      : '¿Eliminar esta clase? Esta acción no se puede deshacer.'
  
    if (!confirm(msg)) return
    setUpdatingId('schedule')
    try {
      const res = await fetch(`/api/agenda/${scheduleId}`, { method: 'DELETE' })
      if (res.ok) {
        onChanged?.()
        onClose()
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
            <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
  <span className="flex items-center gap-1">
    <CalendarIcon size={13} />
    {new Date(schedule.date).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
      timeZone: 'UTC',
    })}
  </span>

  {editing ? (
    <div className="flex items-center gap-2 flex-wrap w-full mt-1">
      <Input
        type="time"
        value={editForm.startTime}
        onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
        className="h-8 w-28 text-sm"
      />
      <span className="text-slate-400">a</span>
      <Input
        type="time"
        value={editForm.endTime}
        onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
        className="h-8 w-28 text-sm"
      />
      <Input
        value={editForm.room}
        onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))}
        placeholder="Sala"
        className="h-8 w-32 text-sm"
      />
      <Button
        size="sm"
        onClick={saveEdit}
        disabled={updatingId === 'edit'}
        className="h-8 gap-1.5"
      >
        <Save size={13} /> Guardar
      </Button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-slate-400 hover:text-slate-600 px-2"
      >
        Cancelar
      </button>
    </div>
  ) : (
    <>
      <span className="flex items-center gap-1">
        <Clock size={13} /> {schedule.startTime.slice(0,5)} - {schedule.endTime.slice(0,5)}
      </span>
      {schedule.room && (
        <span className="flex items-center gap-1">
          <MapPin size={13} /> {schedule.room}
        </span>
      )}
      {status !== 'finalizada' && status !== 'cancelada' && (
        <button
          onClick={startEditing}
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          <Pencil size={11} /> Editar horario
        </button>
      )}
    </>
  )}
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
                href={`/admin/estadisticas/clases?activityId=${schedule.activityId}`}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <TrendingUp size={13} /> Ver estadísticas completas
              </Link>
              <div className="flex gap-2">
  {status !== 'cancelada' && status !== 'finalizada' && (
    <Button
      variant="outline"
      size="sm"
      onClick={cancelSchedule}
      disabled={updatingId === 'schedule'}
      className="text-red-600 border-red-200 hover:bg-red-50"
    >
      Cancelar clase
    </Button>
  )}
  <Button
    variant="outline"
    size="sm"
    onClick={deleteSchedule}
    disabled={updatingId === 'schedule'}
    className="text-slate-500 border-slate-200 hover:bg-slate-50"
    title="Eliminar por completo (para errores de carga)"
  >
    Eliminar
  </Button>
  <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}