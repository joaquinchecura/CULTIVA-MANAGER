'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar, Clock, Users, MapPin, ArrowLeft, CheckCircle,
  AlertCircle, Repeat, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Activity {
  id: string
  name: string
  defaultDuration: number
  maxCapacity: number
  isActive: boolean
}

export default function NuevaClasePage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    activityId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    room: '',
    maxCapacity: '20',
    repeatWeekly: false,
    repeatCount: '4',
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/actividades?type=GROUP')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.filter((a: Activity) => a.isActive !== false))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedActivity = activities.find(a => a.id === formData.activityId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      if (!selectedActivity) {
        setError('Seleccioná una actividad')
        setSaving(false)
        return
      }

      const [hours, minutes] = formData.startTime.split(':').map(Number)
      const endDate = new Date()
      endDate.setHours(hours, minutes + selectedActivity.defaultDuration)
      const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

      const basePayload = {
        activityId: formData.activityId,
        startTime: formData.startTime,
        endTime,
        room: formData.room || undefined,
        maxCapacity: parseInt(formData.maxCapacity),
      }

      // Si es repetición semanal, crear múltiples
      const repeatCount = formData.repeatWeekly ? parseInt(formData.repeatCount) : 1
      
      for (let i = 0; i < repeatCount; i++) {
        const date = new Date(formData.date)
        date.setDate(date.getDate() + (i * 7))
        
        const response = await fetch('/api/agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            date: date.toISOString().split('T')[0],
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || `Error al crear clase ${i + 1}`)
        }
      }

      setSuccess(true)
      setTimeout(() => router.push('/admin/agenda'), 1500)
    } catch (err: any) {
      setError(err.message || 'Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/agenda')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nueva Clase</h2>
          <p className="text-slate-500 text-sm">Programá una clase en la agenda</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={18} />
          ¡Clases creadas exitosamente! Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Actividad */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" /> Actividad *
          </Label>
          <select
            name="activityId"
            required
            value={formData.activityId}
            onChange={handleChange}
            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar actividad</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.name} ({activity.defaultDuration} min · cupo {activity.maxCapacity})
              </option>
            ))}
          </select>
          {selectedActivity && (
            <p className="text-xs text-slate-500">
              Duración automática: {selectedActivity.defaultDuration} minutos · Cupo sugerido: {selectedActivity.maxCapacity}
            </p>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" /> Fecha *
            </Label>
            <Input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Clock size={14} className="text-slate-400" /> Hora inicio *
            </Label>
            <Input
              type="time"
              name="startTime"
              required
              value={formData.startTime}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Sala y cupo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" /> Sala
            </Label>
            <Input
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="Ej: Sala A, Gimnasio principal..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={14} className="text-slate-400" /> Cupo máximo *
            </Label>
            <Input
              type="number"
              name="maxCapacity"
              required
              value={formData.maxCapacity}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>

        {/* Repetición semanal */}
        <div className="border border-slate-200 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="repeatWeekly"
              checked={formData.repeatWeekly}
              onChange={(e) => setFormData(prev => ({ ...prev, repeatWeekly: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Repeat size={14} className="text-slate-400" />
              Repetir semanalmente
            </span>
          </label>
          
          {formData.repeatWeekly && (
            <div className="space-y-1.5 pl-7">
              <Label className="text-xs text-slate-500">Cantidad de semanas</Label>
              <Input
                type="number"
                name="repeatCount"
                value={formData.repeatCount}
                onChange={handleChange}
                min="2"
                max="12"
                className="w-24 h-8 text-sm"
              />
              <p className="text-xs text-slate-400">
                Se crearán {formData.repeatCount} clases: {formData.date} y las siguientes {parseInt(formData.repeatCount)-1} semanas.
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedActivity && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Vista previa</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>{selectedActivity.name}</strong></p>
              <p>{formData.date} · {formData.startTime} → {
                (() => {
                  const [h, m] = formData.startTime.split(':').map(Number)
                  const end = new Date()
                  end.setHours(h, m + selectedActivity.defaultDuration)
                  return `${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`
                })()
              }</p>
              <p>{formData.room ? `Sala: ${formData.room} · ` : ''}Cupo: {formData.maxCapacity}</p>
              {formData.repeatWeekly && (
                <p className="text-blue-600 font-medium">
                  <Repeat size={12} className="inline mr-1" />
                  Se repetirá durante {formData.repeatCount} semanas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="flex-1 gap-2">
            {saving ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" /> : <Plus size={16} />}
            {saving ? 'Guardando...' : (formData.repeatWeekly ? `Crear ${formData.repeatCount} clases` : 'Crear Clase')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/agenda')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}