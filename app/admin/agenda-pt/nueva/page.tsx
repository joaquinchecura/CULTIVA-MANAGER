'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Member { id: string; firstName: string; lastName: string; dni: string }
interface Activity { id: string; name: string; defaultDuration: number }

export default function NuevaSesionPTPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    memberId: '', activityId: '', date: new Date().toISOString().split('T')[0],
    startTime: '08:00', room: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/clientes').then(r => r.json()),
      fetch('/api/actividades').then(r => r.json()),
    ]).then(([m, a]) => {
      setMembers(m)
      setActivities(a)
    })
  }, [])

  const selectedActivity = activities.find(a => a.id === formData.activityId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.memberId || !selectedActivity) {
      setError('Completá cliente y actividad')
      return
    }
    setSaving(true)
    setError('')

    const [h, m] = formData.startTime.split(':').map(Number)
    const end = new Date()
    end.setHours(h, m + selectedActivity.defaultDuration)
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

    try {
      const res = await fetch('/api/agenda-pt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, endTime }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/admin/agenda-pt'), 1200)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al crear la sesión')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/agenda-pt')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Nueva sesión personal</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle size={16} /> Sesión creada
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Cliente *</Label>
          <select
            value={formData.memberId}
            onChange={e => setFormData(p => ({ ...p, memberId: e.target.value }))}
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
            required
          >
            <option value="">Seleccionar cliente</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — DNI {m.dni}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Actividad *</Label>
          <select
            value={formData.activityId}
            onChange={e => setFormData(p => ({ ...p, activityId: e.target.value }))}
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm"
            required
          >
            <option value="">Seleccionar actividad</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.defaultDuration} min)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fecha *</Label>
            <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label>Hora *</Label>
            <Input type="time" value={formData.startTime} onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Sala / lugar</Label>
          <Input value={formData.room} onChange={e => setFormData(p => ({ ...p, room: e.target.value }))} placeholder="Opcional" />
        </div>

        <Button type="submit" disabled={saving} className="w-full gap-2">
          <Plus size={16} /> {saving ? 'Creando...' : 'Crear sesión'}
        </Button>
      </form>
    </div>
  )
}