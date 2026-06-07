'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  durationDays: number
  isActive: boolean
}

interface Member {
  id: string
  firstName: string
  lastName: string
}

export default function AsignarMembresiaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  
  const [member, setMember] = useState<Member | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [autoRenew, setAutoRenew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memberId, setMemberId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setMemberId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (memberId) {
      fetchData()
    }
  }, [memberId])

  const fetchData = async () => {
    try {
      const [memberRes, plansRes] = await Promise.all([
        fetch(`/api/clientes/${memberId}`),
        fetch('/api/planes')
      ])
      
      if (memberRes.ok) {
        const memberData = await memberRes.json()
        setMember(memberData)
      }
      
      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.filter((p: Plan) => p.isActive !== false))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const plan = plans.find(p => p.id === selectedPlan)
      if (!plan) return

      const start = new Date(startDate)
      const end = new Date(start)
      end.setDate(end.getDate() + plan.durationDays)

      const response = await fetch('/api/membresias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          planId: selectedPlan,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          autoRenew,
        }),
      })

      if (response.ok) {
        router.push(`/admin/clientes/${memberId}`)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan)

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-2">Asignar Membresía</h2>
      <p className="text-slate-600 mb-6">Cliente: <span className="font-semibold">{member.firstName} {member.lastName}</span></p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plan *</label>
          <select
            required
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ${plan.price} ({plan.durationDays} días)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio *</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedPlanData && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Vencimiento:</span>{' '}
              {new Date(new Date(startDate).getTime() + selectedPlanData.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR')}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-medium">Precio:</span> ${selectedPlanData.price}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoRenew"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="autoRenew" className="text-sm text-slate-700">Renovación automática</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving || !selectedPlan}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Asignar Membresía'}
          </button>
          <Link
            href={`/admin/clientes/${memberId}`}
            className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 inline-block text-center"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}