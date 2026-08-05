'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Power, PowerOff } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  pack: string
  price: number
  durationDays: number
  classesIncluded: number
  isActive: boolean
  description?: string
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/planes')
      if (response.ok) {
        const data = await response.json()
        setPlans(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePlan = async (id: string) => {
    if (!confirm('¿Estás seguro? Si tiene membresías activas se desactivará en vez de eliminar.')) return

    try {
      const response = await fetch(`/api/planes?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.message?.includes('desactivado')) {
          // Actualizar estado local
          setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p))
        } else {
          setPlans(prev => prev.filter(p => p.id !== id))
        }
      } else {
        alert('Error al eliminar plan')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const toggleActive = async (plan: Plan) => {
    try {
      const response = await fetch(`/api/planes?id=${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })

      if (response.ok) {
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, isActive: !plan.isActive } : p
        ))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const updatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    try {
      const response = await fetch(`/api/planes?id=${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlan.name,
          type: editingPlan.type,
          pack: editingPlan.pack,
          price: editingPlan.price,
          durationDays: editingPlan.durationDays,
          classesIncluded: editingPlan.classesIncluded,
          description: editingPlan.description,
        }),
      })

      if (response.ok) {
        setEditingPlan(null)
        fetchPlans()
      } else {
        alert('Error al actualizar plan')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'Mensual'
      case 'QUARTERLY': return 'Trimestral'
      case 'ANNUAL': return 'Anual'
      case 'PER_CLASS': return 'Por clase'
      default: return type
    }
  }

  const getPackLabel = (pack: string) => {
    switch (pack) {
      case 'GYM_ONLY': return 'Solo gimnasio'
      case 'CLASSES_ONLY': return 'Solo clases'
      case 'GYM_CLASSES': return 'Gimnasio + clases'
      case 'PERSONAL_TRAINER': return 'Personal trainer'
      case 'FULL': return 'Plan Full'
      default: return pack
    }
  }

  const getPackColor = (pack: string) => {
    switch (pack) {
      case 'GYM_ONLY': return 'bg-blue-100 text-blue-800'
      case 'CLASSES_ONLY': return 'bg-purple-100 text-purple-800'
      case 'GYM_CLASSES': return 'bg-green-100 text-green-800'
      case 'PERSONAL_TRAINER': return 'bg-orange-100 text-orange-800'
      case 'FULL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Planes y Membresías</h2>
        <Link 
          href="/admin/planes/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          Nuevo Plan
        </Link>
      </div>

      {/* Modal de edición */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Editar Plan</h3>
            <form onSubmit={updatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={editingPlan.type}
                    onChange={(e) => setEditingPlan({ ...editingPlan, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="MONTHLY">Mensual</option>
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="ANNUAL">Anual</option>
                    <option value="PER_CLASS">Por clase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pack</label>
                  <select
                    value={editingPlan.pack}
                    onChange={(e) => setEditingPlan({ ...editingPlan, pack: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="GYM_ONLY">Solo gimnasio</option>
                    <option value="CLASSES_ONLY">Solo clases</option>
                    <option value="GYM_CLASSES">Gimnasio + clases</option>
                    <option value="PERSONAL_TRAINER">Personal trainer</option>
                    <option value="FULL">Plan Full</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (días)</label>
                  <input
                    type="number"
                    value={editingPlan.durationDays}
                    onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clases incluidas</label>
                <input
                  type="number"
                  value={editingPlan.classesIncluded}
                  onChange={(e) => setEditingPlan({ ...editingPlan, classesIncluded: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-xl border p-6 ${plan.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPackColor(plan.pack)}`}>
                  {getPackLabel(plan.pack)}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => toggleActive(plan)}
                  className={`p-1.5 rounded-lg ${plan.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                  title={plan.isActive ? 'Desactivar' : 'Activar'}
                >
                  {plan.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">Tipo:</span> {getTypeLabel(plan.type)}</p>
              <p><span className="font-medium">Precio:</span> ${plan.price.toLocaleString('es-AR')}</p>
              <p><span className="font-medium">Duración:</span> {plan.durationDays} días</p>
              <p><span className="font-medium">Clases:</span> {plan.classesIncluded === 0 ? 'Ilimitadas' : plan.classesIncluded}</p>
            </div>

            {!plan.isActive && (
              <div className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs rounded-lg text-center">
                Plan inactivo
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No hay planes registrados
        </div>
      )}
    </div>
  )
}