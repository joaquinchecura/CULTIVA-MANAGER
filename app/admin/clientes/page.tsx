'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  status: string
  createdAt: string
  memberships: {
    plan: { name: string }
    endDate: string
    status: string
  }[]
}

export default function ClientesPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const deleteMember = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    
    try {
      const response = await fetch(`/api/clientes?id=${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== id))
      } else {
        alert('Error al eliminar cliente')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredMembers = members.filter(m => 
    m.firstName.toLowerCase().includes(search.toLowerCase()) ||
    m.lastName.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.dni.includes(search)
  )

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Link 
          href="/admin/clientes/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          Nuevo Cliente
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, email o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Membresía</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const activeMembership = member.memberships.find(m => m.status === 'ACTIVE')
              
              return (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{member.firstName} {member.lastName}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{member.dni}</td>
                  <td className="px-4 py-3 text-slate-600">{member.email}</td>
                  <td className="px-4 py-3 text-slate-600">{member.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      member.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600' :
                      member.status === 'FROZEN' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {activeMembership ? (
                      <div>
                        <span className="text-sm text-slate-900">{activeMembership.plan.name}</span>
                        <span className="text-xs text-slate-500 block">
                          Vence: {new Date(activeMembership.endDate).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Sin membresía</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/clientes/${member.id}/editar`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No se encontraron clientes
          </div>
        )}
      </div>
    </div>
  )
}