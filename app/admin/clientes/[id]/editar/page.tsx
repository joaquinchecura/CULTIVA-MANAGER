// app/admin/clientes/[id]/editar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Camera, Shield, CreditCard, Calendar, Save, X, Loader2 } from 'lucide-react'

interface Plan {
  id: string
  name: string
  pack: string
  price: number
  durationDays: number
  isActive: boolean
}

interface Membership {
  id: string
  planId: string
  startDate: string
  endDate: string
  status: string
  plan: Plan
}

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [membership, setMembership] = useState<Membership | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    city: '',
    photoUrl: '',
    status: 'PENDING',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
    internalNotes: '',
    // Membresía
    assignMembership: false,
    planId: '',
    membershipStartDate: '',
    membershipEndDate: '',
  })

  useEffect(() => {
    fetchData()
  }, [memberId])

  const fetchData = async () => {
    try {
      const [memberRes, plansRes] = await Promise.all([
        fetch(`/api/clientes/${memberId}`),
        fetch('/api/planes'),
      ])

      if (memberRes.ok) {
        const data = await memberRes.json()
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dni: data.dni || '',
          email: data.email || '',
          phone: data.phone || '',
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
          address: data.address || '',
          city: data.city || '',
          photoUrl: data.photoUrl || '',
          status: data.status || 'PENDING',
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          medicalNotes: data.medicalNotes || '',
          internalNotes: data.internalNotes || '',
        }))
        
        if (data.memberships && data.memberships[0]) {
          const mem = data.memberships[0]
          setMembership(mem)
          setFormData(prev => ({
            ...prev,
            planId: mem.planId,
            membershipStartDate: new Date(mem.startDate).toISOString().split('T')[0],
            membershipEndDate: new Date(mem.endDate).toISOString().split('T')[0],
          }))
        }
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json()
        setPlans(plansData.filter((p: Plan) => p.isActive))
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
      const response = await fetch(`/api/clientes/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dni: formData.dni,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate,
          address: formData.address,
          city: formData.city,
          photoUrl: formData.photoUrl,
          status: formData.status,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          medicalNotes: formData.medicalNotes,
          internalNotes: formData.internalNotes,
          // Membresía
          assignMembership: formData.assignMembership,
          planId: formData.planId,
          membershipStartDate: formData.membershipStartDate,
          membershipEndDate: formData.membershipEndDate,
        }),
      })

      if (response.ok) {
        router.push(`/admin/clientes/${memberId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Error al actualizar cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Calcular fecha fin automáticamente según el plan seleccionado
  const calculateEndDate = (startDate: string, planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan || !startDate) return
    
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + plan.durationDays)
    
    setFormData(prev => ({
      ...prev,
      planId,
      membershipEndDate: end.toISOString().split('T')[0],
    }))
  }

  const statusOptions = [
    { value: 'ACTIVE', label: 'Activo', color: 'text-green-700 bg-green-100' },
    { value: 'INACTIVE', label: 'Inactivo', color: 'text-zinc-700 bg-zinc-100' },
    { value: 'PENDING', label: 'Pendiente', color: 'text-amber-700 bg-amber-100' },
    { value: 'FROZEN', label: 'Congelado', color: 'text-blue-700 bg-blue-100' },
    { value: 'OVERDUE', label: 'Vencido', color: 'text-red-700 bg-red-100' },
  ]

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold">Editar Cliente</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto de perfil */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Camera size={18} className="text-purple-600" />
            Foto de Perfil
          </h3>
          <div className="flex items-center gap-4">
            {formData.photoUrl ? (
              <img 
                src={formData.photoUrl} 
                alt="Preview" 
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                <Camera size={24} className="text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL de la foto</label>
              <input
                type="url"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Dejá vacío para usar el avatar por defecto</p>
            </div>
          </div>
        </div>

        {/* Datos personales */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-4">Datos Personales</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
              <input
                type="text"
                name="dni"
                required
                value={formData.dni}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento *</label>
              <input
                type="date"
                name="birthDate"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Estado de la cuenta */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Shield size={18} className="text-blue-600" />
            Estado de la Cuenta
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado actual</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.status === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={formData.status === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className={formData.status === opt.value ? opt.color : 'text-slate-600'}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Membresía */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-green-600" />
            Membresía
          </h3>

          {membership && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                Membresía actual: <span className="font-medium text-slate-900">{membership.plan.name}</span>
              </p>
              <p className="text-xs text-slate-500">
                Vence: {new Date(membership.endDate).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              name="assignMembership"
              checked={formData.assignMembership}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-slate-700">
              {membership ? 'Modificar membresía' : 'Asignar nueva membresía'}
            </span>
          </label>

          {formData.assignMembership && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan *</label>
                <select
                  name="planId"
                  required={formData.assignMembership}
                  value={formData.planId}
                  onChange={(e) => calculateEndDate(formData.membershipStartDate, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — ${plan.price.toLocaleString('es-AR')} ({plan.durationDays} días)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio *</label>
                  <input
                    type="date"
                    name="membershipStartDate"
                    required={formData.assignMembership}
                    value={formData.membershipStartDate}
                    onChange={(e) => calculateEndDate(e.target.value, formData.planId)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha vencimiento *</label>
                  <input
                    type="date"
                    name="membershipEndDate"
                    required={formData.assignMembership}
                    value={formData.membershipEndDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contacto de emergencia */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-4">Contacto de Emergencia</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-4">Notas</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas médicas</label>
            <textarea
              name="medicalNotes"
              value={formData.medicalNotes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Alergias, condiciones, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas (solo staff)</label>
            <textarea
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones del entrenador..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/clientes/${memberId}`)}
            className="flex items-center gap-2 bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg hover:bg-slate-300 font-medium"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}