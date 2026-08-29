'use client'

import { useEffect, useState } from 'react'
import {
  Dumbbell, Plus, Search, Edit2, Trash2, Clock, Users, Power, X, CheckCircle,
  LayoutGrid, List, Flame, HeartPulse, Bike, Zap, Move, Timer, Sparkles, Waves,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Activity {
  id: string
  name: string
  description: string | null
  type: 'GROUP' | 'PERSONAL'
  defaultDuration: number
  maxCapacity: number
  isActive: boolean
  createdAt: string
  _count?: { schedules: number }
}

type ViewMode = 'grid' | 'list'

// Pool de íconos y colores pastel para dar variedad visual entre actividades.
// La asignación es determinística por id (hash), no aleatoria: la misma
// actividad siempre muestra el mismo ícono/color entre renders.
const ICON_POOL = [Dumbbell, Flame, HeartPulse, Bike, Zap, Move, Timer, Sparkles, Waves, Users]
const COLOR_POOL = [
  { bg: 'bg-blue-50', text: 'text-blue-600' },
  { bg: 'bg-violet-50', text: 'text-violet-600' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { bg: 'bg-amber-50', text: 'text-amber-600' },
  { bg: 'bg-pink-50', text: 'text-pink-600' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  { bg: 'bg-orange-50', text: 'text-orange-600' },
  { bg: 'bg-teal-50', text: 'text-teal-600' },
]

function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getActivityStyle(activity: Activity) {
  const idx = hashString(activity.id)
  const Icon = ICON_POOL[idx % ICON_POOL.length]
  const color = COLOR_POOL[idx % COLOR_POOL.length]
  return { Icon, ...color }
}

export default function ActividadesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterType, setFilterType] = useState<'all' | 'GROUP' | 'PERSONAL'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'duration' | 'capacity'>('name')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GROUP' as 'GROUP' | 'PERSONAL',
    defaultDuration: '60',
    maxCapacity: '20',
    isActive: true,
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

  const resetForm = () => {
    setFormData({
      name: '', description: '', type: 'GROUP',
      defaultDuration: '60', maxCapacity: '20', isActive: true,
    })
    setEditingId(null)
  }

  const handleEdit = (activity: Activity) => {
    setFormData({
      name: activity.name,
      description: activity.description || '',
      type: activity.type,
      defaultDuration: String(activity.defaultDuration),
      maxCapacity: String(activity.maxCapacity),
      isActive: activity.isActive,
    })
    setEditingId(activity.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingId ? `/api/actividades/${editingId}` : '/api/actividades'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          defaultDuration: parseInt(formData.defaultDuration),
          maxCapacity: parseInt(formData.maxCapacity),
        }),
      })

      if (response.ok) {
        resetForm()
        setShowForm(false)
        fetchActivities()
      } else {
        const err = await response.json()
        alert(err.error?.[0]?.message || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    try {
      const response = await fetch(`/api/actividades/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchActivities()
      } else {
        const err = await response.json().catch(() => null)
        alert(err?.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`/api/actividades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      })
      if (response.ok) fetchActivities()
    } catch (error) {
      console.error(error)
    }
  }

  const filteredActivities = activities
    .filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
      const matchesFilter =
        filterActive === 'all' ? true :
        filterActive === 'active' ? a.isActive : !a.isActive
      const matchesType = filterType === 'all' ? true : a.type === filterType
      return matchesSearch && matchesFilter && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'duration') return a.defaultDuration - b.defaultDuration
      return a.maxCapacity - b.maxCapacity
    })

  const stats = {
    total: activities.length,
    active: activities.filter(a => a.isActive).length,
    inactive: activities.filter(a => !a.isActive).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell size={24} className="text-blue-600" />
            Actividades
          </h2>
          <p className="text-slate-500 mt-1">Gestión de actividades y disciplinas del gimnasio</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus size={16} /> Nueva Actividad
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Activas</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Inactivas</p>
          <p className="text-2xl font-bold text-slate-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar actividad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="all">Todos los tipos</option>
          <option value="GROUP">Clases grupales</option>
          <option value="PERSONAL">Personal trainer</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="name">Ordenar: Nombre</option>
          <option value="duration">Ordenar: Duración</option>
          <option value="capacity">Ordenar: Cupo</option>
        </select>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Editar Actividad' : 'Nueva Actividad'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Tipo — primera decisión del form */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Tipo de actividad *</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'GROUP' })}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      formData.type === 'GROUP'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Clase grupal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'PERSONAL', maxCapacity: '1' })}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      formData.type === 'PERSONAL'
                        ? 'bg-violet-50 border-violet-300 text-violet-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Personal trainer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Nombre *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Funcional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Duración (min) *</Label>
                  <Input
                    type="number"
                    required
                    value={formData.defaultDuration}
                    onChange={(e) => setFormData({ ...formData, defaultDuration: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Descripción</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descripción de la actividad"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {formData.type === 'GROUP' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Cupo por defecto *</Label>
                    <Input
                      type="number"
                      required
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Estado</Label>
                  <div className="flex items-center gap-2 h-10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Power size={14} />
                      {formData.isActive ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1 gap-2">
                  {saving ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full" /> : <CheckCircle size={16} />}
                  {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Actividad')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => {
            const style = getActivityStyle(activity)
            return (
              <div
                key={activity.id}
                className={`bg-white rounded-xl border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  activity.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activity.isActive ? `${style.bg} ${style.text}` : 'bg-slate-100 text-slate-400'
                  }`}>
                    <style.Icon size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900">{activity.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    activity.type === 'PERSONAL' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {activity.type === 'PERSONAL' ? 'Personal' : 'Grupal'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{activity.description || 'Sin descripción'}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    {activity.defaultDuration} min
                  </span>
                  {activity.type === 'GROUP' && (
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {activity.maxCapacity} cupo
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(activity.id, activity.isActive)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      activity.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {activity.isActive ? '● Activa' : '○ Inactiva'}
                  </button>
                  <span className="text-xs text-slate-400">
                    {activity._count?.schedules || 0} clases programadas
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Actividad</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Duración</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cupo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => {
                const style = getActivityStyle(activity)
                return (
                  <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          activity.isActive ? `${style.bg} ${style.text}` : 'bg-slate-100 text-slate-400'
                        }`}>
                          <style.Icon size={16} />
                        </div>
                        <span className="font-medium text-slate-900">{activity.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        activity.type === 'PERSONAL' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {activity.type === 'PERSONAL' ? 'Personal' : 'Grupal'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-[200px] truncate">
                      {activity.description || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{activity.defaultDuration} min</td>
                    <td className="px-5 py-4 text-slate-600">{activity.type === 'GROUP' ? activity.maxCapacity : '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(activity.id, activity.isActive)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          activity.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {activity.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(activity)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(activity.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <Dumbbell size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No se encontraron actividades</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Probá con otra búsqueda' : 'Creá la primera actividad para empezar'}
          </p>
        </div>
      )}
    </div>
  )
}