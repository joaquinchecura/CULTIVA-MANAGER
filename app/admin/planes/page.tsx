'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  type: string
  pack: string
  price: number
  durationDays: number
  classesIncluded: number
  isActive: boolean
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

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
      case 'GYM_CLASSES': return 'Gimnasio + clases'
      case 'GYM_CLASSES_TRAINER': return 'Gimnasio + clases + entrenador'
      default: return pack
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {plan.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">Tipo:</span> {getTypeLabel(plan.type)}</p>
              <p><span className="font-medium">Pack:</span> {getPackLabel(plan.pack)}</p>
              <p><span className="font-medium">Precio:</span> ${plan.price}</p>
              <p><span className="font-medium">Duración:</span> {plan.durationDays} días</p>
              <p><span className="font-medium">Clases:</span> {plan.classesIncluded === 0 ? 'Ilimitadas' : plan.classesIncluded}</p>
            </div>
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