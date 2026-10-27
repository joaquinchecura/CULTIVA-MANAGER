'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, AlertCircle, CheckCircle, Repeat, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Member { id: string; firstName: string; lastName: string; dni: string }
interface Activity { id: string; name: string; defaultDuration: number }

const DIAS_SEMANA = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

export default function NuevaSesionPTPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    memberId: '',
    activityId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    room: '',
    isRecurring: false,
    selectedDays: [] as number[], // 0=Domingo, 1=Lunes...
    totalClasses: '8',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/clientes').then(r => r.json()),
      fetch('/api/actividades?type=PERSONAL').then(r => r.json()),
    ]).then(([m, a]) => {
      setMembers(m)
      setActivities(a)
    })
  }, [])

  const selectedActivity = activities.find(a => a.id === formData.activityId)

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.memberId || !selectedActivity) {
      setError('Completá cliente y actividad')
      return
    }

    if (formData.isRecurring && formData.selectedDays.length === 0) {
      setError('Seleccioná al menos un día de la semana')
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
        body: JSON.stringify({
          ...formData,
          endTime,
          totalClasses: parseInt(formData.totalClasses),
        }),
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/admin/agenda-pt'), 1200)
      } else {
        const data = await res.json()
        setError(data.error || 'Error al crear la sesión')
      }
    } catch (err) {
      setError('Error de conexión')
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
          <CheckCircle size={16} /> Sesión(es) creada(s)
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
            <Label>Fecha inicio *</Label>
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

        {/* 👇 NUEVA SECCIÓN: Recurrencia */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(p => ({ ...p, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Repeat size={16} className="text-blue-600" />
              Agendar múltiples clases
            </span>
          </label>

          {formData.isRecurring && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">Días de la semana *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS_SEMANA.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formData.selectedDays.includes(d.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">Cantidad total de clases *</Label>
                <Input
                  type="number"
                  min="2"
                  max="50"
                  value={formData.totalClasses}
                  onChange={e => setFormData(p => ({ ...p, totalClasses: e.target.value }))}
                  className="w-32"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Se crearán {formData.totalClasses} sesiones, distribuidas en los días seleccionados a partir de la fecha de inicio.
                </p>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" disabled={saving} className="w-full gap-2">
          {saving ? (
            'Creando...'
          ) : (
            <>
              <CalendarDays size={16} />
              {formData.isRecurring 
                ? `Crear ${formData.totalClasses} clases`
                : 'Crear sesión'}
            </>
          )}
        </Button>
      </form>
    </div>
  )
}