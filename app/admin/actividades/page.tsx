'use client'

import { useEffect, useState } from 'react'

interface Activity {
  id: string
  name: string
  description: string | null
  defaultDuration: number
  maxCapacity: number
  isActive: boolean
}

export default function ActividadesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultDuration: '60',
    maxCapacity: '20',
  })

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/actividades')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          defaultDuration: parseInt(formData.defaultDuration),
          maxCapacity: parseInt(formData.maxCapacity),
        }),
      })

      if (response.ok) {
        setFormData({ name: '', description: '', defaultDuration: '60', maxCapacity: '20' })
        setShowForm(false)
        fetchActivities()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Actividades</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Nueva Actividad'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min) *</label>
              <input
                type="number"
                required
                value={formData.defaultDuration}
                onChange={(e) => setFormData({...formData, defaultDuration: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cupo por defecto *</label>
            <input
              type="number"
              required
              value={formData.maxCapacity}
              onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Guardar Actividad
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <div key={activity.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{activity.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${activity.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {activity.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-2">{activity.description || 'Sin descripción'}</p>
            <div className="text-sm text-slate-500">
              <p>Duración: {activity.defaultDuration} min</p>
              <p>Cupo: {activity.maxCapacity}</p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No hay actividades. Creá las primeras: Funcional, Musculación, Personal Trainer.
        </div>
      )}
    </div>
  )
}