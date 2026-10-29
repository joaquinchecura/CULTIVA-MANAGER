'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  durationDays: number
  isActive: boolean
}

interface Membership {
  id: string
  startDate: string
  endDate: string
  status: string
  plan: { name: string }
}

interface Member {
  id: string
  firstName: string
  lastName: string
  memberships?: Membership[]
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
        router.refresh()
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
  const memberships = member.memberships || []
  const activeMembership = memberships.find(m => m.status === 'ACTIVE')
  const pastMemberships = memberships.filter(m => m.status !== 'ACTIVE')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/clientes/${memberId}`} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
          <Clock size={20} /> {/* Usamos Clock como ícono de volver o podés importar ArrowLeft */}
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Asignar Membresía</h2>
          <p className="text-slate-500 text-sm">
            Cliente: <span className="font-semibold text-slate-700">{member.firstName} {member.lastName}</span>
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
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
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Vencimiento:</span>{' '}
                {new Date(new Date(startDate).getTime() + selectedPlanData.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
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
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Guardando...' : 'Asignar Membresía'}
            </button>
            <Link
              href={`/admin/clientes/${memberId}`}
              className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 inline-block text-center font-medium"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Historial de Membresías */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            Historial de Membresías
          </h3>
          <span className="text-xs text-slate-400">{memberships.length} en total</span>
        </div>

        {memberships.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Este cliente no tiene membresías registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {memberships.map((mem) => {
              const isActive = mem.status === 'ACTIVE'
              return (
                <div key={mem.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {isActive ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{mem.plan.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(mem.startDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                        {' → '}
                        {new Date(mem.endDate).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isActive ? 'Activa' : 'Vencida'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}