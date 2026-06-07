'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Member {
  id: string
  firstName: string
  lastName: string
  dni: string
  email: string
  phone: string
  status: string
  address: string | null
  city: string | null
  birthDate: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  medicalNotes: string | null
  memberships: {
    id: string
    plan: { name: string }
    startDate: string
    endDate: string
    status: string
  }[]
}

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (id) {
      fetchMember()
    }
  }, [id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/clientes/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMember(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  if (!member) {
    return <div className="p-6">Cliente no encontrado</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{member.firstName} {member.lastName}</h2>
        <div className="flex gap-2">
          <Link 
            href={`/admin/clientes/${member.id}/membresia`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Asignar Plan
          </Link>
          <Link 
            href="/admin/clientes"
            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold mb-4">Datos Personales</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">DNI:</span> {member.dni}</p>
            <p><span className="font-medium">Email:</span> {member.email}</p>
            <p><span className="font-medium">Teléfono:</span> {member.phone}</p>
            <p><span className="font-medium">Fecha de Nacimiento:</span> {new Date(member.birthDate).toLocaleDateString('es-AR')}</p>
            <p><span className="font-medium">Dirección:</span> {member.address || '-'}</p>
            <p><span className="font-medium">Ciudad:</span> {member.city || '-'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold mb-4">Contacto de Emergencia</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Nombre:</span> {member.emergencyContactName || '-'}</p>
            <p><span className="font-medium">Teléfono:</span> {member.emergencyContactPhone || '-'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:col-span-2">
          <h3 className="text-lg font-bold mb-4">Membresías</h3>
          {member.memberships.length > 0 ? (
            <div className="space-y-2">
              {member.memberships.map((mem) => (
                <div key={mem.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{mem.plan.name}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(mem.startDate).toLocaleDateString('es-AR')} - {new Date(mem.endDate).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mem.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {mem.status === 'ACTIVE' ? 'Activa' : mem.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No hay membresías activas</p>
          )}
        </div>
      </div>
    </div>
  )
}