'use client'

import { useState } from 'react'
import { Plus, Calendar, Clock } from 'lucide-react'

interface Activity {
  id: string
  name: string
  defaultDuration: number
}

interface Props {
  memberId: string
  activities: Activity[]
}

export default function AsignarClasePersonal({ memberId, activities }: Props) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    activityId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    room: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.activityId) {
      alert('Seleccioná una actividad')
      return
    }

    setSaving(true)
    try {
      const activity = activities.find(a => a.id === formData.activityId)
      if (!activity) return

      // Calcular endTime
      const [hours, minutes] = formData.startTime.split(':').map(Number)
      const endDate = new Date()
      endDate.setHours(hours, minutes + activity.defaultDuration)
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

      const res = await fetch('/api/bookings/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          activityId: formData.activityId,
          date: formData.date,
          startTime: formData.startTime,
          endTime,
          room: formData.room,
        }),
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al asignar clase')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Plus size={18} className="text-blue-600" />
        Asignar Clase Personalizada
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Actividad *</label>
          <select
            required
            value={formData.activityId}
            onChange={(e) => setFormData(prev => ({ ...prev, activityId: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar actividad</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.defaultDuration} min)</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hora inicio *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sala / Lugar</label>
          <input
            type="text"
            value={formData.room}
            onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
            placeholder="Ej: Sala 2, Parque, etc."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Asignando...' : 'Asignar Clase'}
        </button>
      </form>
    </div>
  )
}