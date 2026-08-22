'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, CheckCircle2, XCircle, UserX, Loader2 } from 'lucide-react'
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
  bookingId,
  memberName,
  activityName,
  startTime,
  endTime,
  room,
  status,
  sessionInfo,
}: {
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