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
  memberships: {
    plan: {
      name: string
    }
    endDate: string
  }[]
}

export default function ClientesPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/clientes')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'FROZEN': return 'bg-blue-100 text-blue-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo'
      case 'INACTIVE': return 'Inactivo'
      case 'FROZEN': return 'Congelado'
      case 'OVERDUE': return 'Moroso'
      default: return status
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Link 
          href="/admin/clientes/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nuevo Cliente
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">DNI</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Teléfono</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Estado</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${member.id}`} className="text-blue-600 hover:underline font-medium">
                    {member.firstName} {member.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{member.dni}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{member.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{member.phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {member.memberships[0]?.plan?.name || 'Sin plan'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {member.memberships[0]?.endDate 
                    ? new Date(member.memberships[0].endDate).toLocaleDateString('es-AR')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {members.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No hay clientes registrados
          </div>
        )}
      </div>
    </div>
  )
}