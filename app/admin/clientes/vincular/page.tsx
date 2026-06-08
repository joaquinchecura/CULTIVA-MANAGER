'use client'

import { useEffect, useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  dni: string
  clerkUserId: string | null
}

interface ClerkUser {
  id: string
  emailAddresses: { emailAddress: string }[]
  firstName: string | null
  lastName: string | null
}

export default function VincularPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([])
  const [loading, setLoading] = useState(true)
  const [vinculando, setVinculando] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/clerk/users'),
      ])

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.filter((m: Member) => !m.clerkUserId)) // Solo no vinculados
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setClerkUsers(usersData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const vincular = async (memberId: string, clerkUserId: string) => {
    setVinculando(memberId)
    try {
      const response = await fetch('/api/clientes/vincular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, clerkUserId }),
      })

      if (response.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      } else {
        alert('Error al vincular')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setVinculando(null)
    }
  }

  if (loading) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Vincular Clientes con Clerk</h2>
      
      <p className="text-slate-600 mb-4">
        Clientes sin cuenta de Clerk vinculada: {members.length}
      </p>

      {members.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <Check className="mx-auto mb-2 text-green-600" size={32} />
          <p className="text-green-800 font-medium">Todos los clientes están vinculados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map(member => {
            // Buscar usuario de Clerk con mismo email
            const matchingUser = clerkUsers.find(u => 
              u.emailAddresses.some(e => e.emailAddress === member.email)
            )

            return (
              <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{member.firstName} {member.lastName}</h3>
                    <p className="text-sm text-slate-500">{member.email} · DNI: {member.dni}</p>
                  </div>
                  
                  {matchingUser ? (
                    <button
                      onClick={() => vincular(member.id, matchingUser.id)}
                      disabled={vinculando === member.id}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Link2 size={16} />
                      {vinculando === member.id ? 'Vinculando...' : 'Vincular'}
                    </button>
                  ) : (
                    <span className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                      No tiene cuenta en Clerk
                    </span>
                  )}
                </div>
                
                {matchingUser && (
                  <p className="text-xs text-slate-400 mt-2">
                    Coincide con: {matchingUser.firstName} {matchingUser.lastName} ({matchingUser.emailAddresses[0]?.emailAddress})
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}