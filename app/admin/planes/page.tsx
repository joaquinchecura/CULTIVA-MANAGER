'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Power, PowerOff } from 'lucide-react'
import { updatePlanAction } from './actions'
import { toast } from 'sonner'

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
  const [isPending, startTransition] = useTransition()

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
          setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p))
        } else {
          setPlans(prev => prev.filter(p => p.id !== id))
        }
      } else {
        toast.error('Error al eliminar plan')
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

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updatePlanAction(formData)
      if (result.success) {
        toast.success('Plan actualizado con éxito')
        setEditingPlan(null)
        fetchPlans()
      } else {
        toast.error(result.error || 'Error al actualizar')
      }
    })
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

  const getPackStyles = (pack: string) => {
    switch (pack) {
      case 'GYM_ONLY': return { badge: 'bg-blue-100 text-blue-800', card: 'border-blue-200 bg-blue-50/30' }
      case 'CLASSES_ONLY': return { badge: 'bg-purple-100 text-purple-800', card: 'border-purple-200 bg-purple-50/30' }
      case 'GYM_CLASSES': return { badge: 'bg-emerald-100 text-emerald-800', card: 'border-emerald-200 bg-emerald-50/30' }
      case 'PERSONAL_TRAINER': return { badge: 'bg-orange-100 text-orange-800', card: 'border-orange-200 bg-orange-50/30' }
      case 'FULL': return { badge: 'bg-pink-100 text-pink-800', card: 'border-pink-200 bg-pink-50/30' }
      default: return { badge: 'bg-gray-100 text-gray-800', card: 'border-gray-200' }
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-500">Cargando planes...</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Planes y Membresías</h2>
        <Link 
          href="/admin/planes/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Plan
        </Link>
      </div>

      {/* Modal de edición */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Editar Plan</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={editingPlan.id} />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingPlan.name}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    name="type"
                    defaultValue={editingPlan.type}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    name="pack"
                    defaultValue={editingPlan.pack}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    name="price"
                    step="0.01"
                    defaultValue={editingPlan.price}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (días)</label>
                  <input
                    type="number"
                    name="durationDays"
                    defaultValue={editingPlan.durationDays}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clases incluidas (0 = ilimitadas)</label>
                <input
                  type="number"
                  name="classesIncluded"
                  defaultValue={editingPlan.classesIncluded}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  name="description"
                  defaultValue={editingPlan.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? 'Guardando...' : 'Guardar cambios'}
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
        {plans.map((plan) => {
          const styles = getPackStyles(plan.pack)
          return (
            <div 
              key={plan.id} 
              className={`rounded-xl border p-6 transition-all duration-200 ${styles.card} ${plan.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-xs font-semibold ${styles.badge}`}>
                    {getPackLabel(plan.pack)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingPlan(plan)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(plan)}
                    className={`p-1.5 rounded-lg transition-colors ${plan.isActive ? 'text-amber-600 hover:bg-amber-100' : 'text-green-600 hover:bg-green-100'}`}
                    title={plan.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {plan.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {plan.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{plan.description}</p>
              )}

              <div className="space-y-2 text-sm text-slate-600 bg-white/50 p-3 rounded-lg">
                <p><span className="font-medium">Tipo:</span> {getTypeLabel(plan.type)}</p>
                <p><span className="font-medium">Precio:</span> ${plan.price.toLocaleString('es-AR')}</p>
                <p><span className="font-medium">Duración:</span> {plan.durationDays} días</p>
                <p><span className="font-medium">Clases:</span> {plan.classesIncluded === 0 ? 'Ilimitadas' : plan.classesIncluded}</p>
              </div>

              {!plan.isActive && (
                <div className="mt-3 px-3 py-1.5 bg-slate-200/50 text-slate-500 text-xs rounded-lg text-center font-medium">
                  Plan inactivo
                </div>
              )}
            </div>
          )
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
          No hay planes registrados. <Link href="/admin/planes/nuevo" className="text-blue-600 hover:underline">Creá tu primer plan</Link>.
        </div>
      )}
    </div>
  )
}