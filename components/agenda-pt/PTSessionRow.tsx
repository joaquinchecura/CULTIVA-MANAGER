'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, CheckCircle2, XCircle, UserX, Loader2, Pencil, Save, X as XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SessionInfo {
  current: number
  total: number
  remaining: number
  planName: string
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'border-l-4 border-l-blue-500',
  COMPLETED: 'border-l-4 border-l-emerald-500',
  CANCELLED: 'border-l-4 border-l-red-500 opacity-60',
  NO_SHOW:   'border-l-4 border-l-amber-500',
}

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  CONFIRMED: { label: 'Reservada', badge: 'bg-blue-50 text-blue-700' },
  COMPLETED: { label: 'Realizada', badge: 'bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Cancelada', badge: 'bg-red-50 text-red-700' },
  NO_SHOW:   { label: 'Ausente',   badge: 'bg-amber-50 text-amber-700' },
}

export default function PTSessionRow({
  scheduleId,
  bookingId,
  memberName,
  activityName,
  startTime,
  endTime,
  room,
  status,
  sessionInfo,
}: {
  scheduleId: string
  bookingId: string | null
  memberName: string
  activityName: string
  startTime: string
  endTime: string
  room: string | null
  status: string
  sessionInfo: SessionInfo | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    startTime: startTime.slice(0, 5),
    endTime: endTime.slice(0, 5),
    room: room || '',
  })

  async function updateStatus(newStatus: string) {
    if (!bookingId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function saveEdit() {
    setLoading(true)
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
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className={cn('px-4 py-3', STATUS_COLOR[status])}>
        <p className="text-sm font-semibold text-slate-900 mb-2">{memberName}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="time"
            value={editForm.startTime}
            onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
            className="h-8 w-28 text-sm"
          />
          <span className="text-slate-400 text-xs">a</span>
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
          <button
            onClick={saveEdit}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={12} /> Guardar
          </button>
          <button
            onClick={() => setEditing(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600"
          >
            <XIcon size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('px-4 py-3 flex items-center justify-between gap-4', STATUS_COLOR[status])}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900">{memberName}</p>
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', STATUS_LABEL[status].badge)}>
            {STATUS_LABEL[status].label}
          </span>
          {sessionInfo && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700">
              Sesión {sessionInfo.current}/{sessionInfo.total} · quedan {sessionInfo.remaining}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>{activityName}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {startTime.slice(0,5)} - {endTime.slice(0,5)}</span>
          {room && <span className="flex items-center gap-1"><MapPin size={11} /> {room}</span>}
        </div>
      </div>

      {status === 'CONFIRMED' && bookingId && (
        <div className="flex items-center gap-1 shrink-0">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-slate-300" />
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Modificar horario"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => updateStatus('COMPLETED')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                title="Marcar realizada"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => updateStatus('NO_SHOW')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                title="Marcar ausente"
              >
                <UserX size={16} />
              </button>
              <button
                onClick={() => updateStatus('CANCELLED')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Cancelar"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}