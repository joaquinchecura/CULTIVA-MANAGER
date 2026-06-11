'use client'

import { useEffect, useState } from 'react'
import { Link2, Check, UserCheck } from 'lucide-react'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  dni: string
  phone: string
  birthDate: string
  clerkUserId: string | null
  status: string
}

export default function VincularPage() {
  const [pendingMembers, setPendingMembers] = useState<<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [autorizando, setAutorizando] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingMembers()
  }, [])

  const fetchPendingMembers = async () => {
    try {
      const response = await fetch('/api/clientes/pendientes')
      if (response.ok) {
        const data = await response.json()
        setPendingMembers(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const autorizar = async (memberId: string) => {
    setAutorizando(memberId)
    try {
      const response = await fetch('/api/clientes/autorizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (response.ok) {
        setPendingMembers(prev => prev.filter(m => m.id !== memberId))
        alert('Cliente autorizado correctamente')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al autorizar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error de conexión')
    } finally {
      setAutorizando(null)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Autorizar Clientes</h2>
      <p className="text-slate-500 mb-6">
        Clientes pendientes de aprobación: {pendingMembers.length}
      </p>

      {pendingMembers.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <UserCheck className="mx-auto mb-3 text-green-600" size={40} />
          <p className="text-green-800 font-medium text-lg">No hay clientes pendientes</p>
          <p className="text-green-600 text-sm mt-1">Todos los clientes están autorizados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingMembers.map(member => (
            <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {member.firstName} {member.lastName}
                    </h3>
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                      PENDIENTE
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p><span className="text-slate-400">DNI:</span> {member.dni}</p>
                    <p><span className="text-slate-400">Email:</span> {member.email}</p>
                    <p><span className="text-slate-400">Tel:</span> {member.phone}</p>
                    <p><span className="text-slate-400">Nac:</span> {new Date(member.birthDate).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => autorizar(member.id)}
                  disabled={autorizando === member.id}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                >
                  <Check size={16} />
                  {autorizando === member.id ? 'Autorizando...' : 'Autorizar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}