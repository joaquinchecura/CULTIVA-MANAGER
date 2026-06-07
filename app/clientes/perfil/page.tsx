'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, RefreshCw, Crown, Calendar, Phone, Mail, MapPin } from 'lucide-react'

interface MemberProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  birthDate: string
  address: string | null
  city: string | null
  photoUrl: string | null
  status: string
  memberships: {
    plan: { name: string }
    endDate: string
    status: string
  }[]
}

export default function PerfilPage() {
  const { user } = useUser()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrToken, setQrToken] = useState('')
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null)

  useEffect(() => {
    if (user) {
      fetchProfile()
      generateQR()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/clientes/perfil')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQR = async () => {
    try {
      const response = await fetch('/api/acceso/qr', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setQrToken(data.token)
        setQrExpiry(new Date(data.expiresAt))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(qrToken)
    alert('Código copiado')
  }

  if (loading) {
    return <div className="p-4">Cargando...</div>
  }

  if (!profile) {
    return <div className="p-4">No se encontró el perfil</div>
  }

  const activeMembership = profile.memberships.find(m => m.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      {/* Header del perfil */}
      <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
        <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-blue-600">
          {profile.firstName[0]}{profile.lastName[0]}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
        <p className="text-sm text-slate-500">DNI: {profile.dni}</p>
        
        {activeMembership && (
          <div className="mt-3 inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            <Crown size={14} />
            {activeMembership.plan.name}
          </div>
        )}
      </div>

      {/* QR de Acceso */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Acceso al Gimnasio</h3>
        
        {qrToken ? (
          <div className="text-center">
            <div className="bg-slate-50 rounded-xl p-4 inline-block">
              <QRCodeSVG value={qrToken} size={200} />
            </div>
            <p className="text-sm text-slate-500 mt-2">Escaneá en recepción</p>
            
            <div className="flex gap-2 justify-center mt-3">
              <button 
                onClick={copyToken}
                className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
              >
                <Copy size={14} />
                Copiar código
              </button>
              <button 
                onClick={generateQR}
                className="flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg"
              >
                <RefreshCw size={14} />
                Regenerar
              </button>
            </div>
            
            {qrExpiry && (
              <p className="text-xs text-slate-400 mt-2">
                Vence: {qrExpiry.toLocaleTimeString('es-AR')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <button 
              onClick={generateQR}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
            >
              Generar QR de acceso
            </button>
          </div>
        )}
      </div>

      {/* Datos personales */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Mis Datos</h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-slate-900">{profile.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Teléfono</p>
              <p className="text-slate-900">{profile.phone}</p>
            </div>
          </div>
          
          {profile.address && (
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Dirección</p>
                <p className="text-slate-900">{profile.address}{profile.city ? `, ${profile.city}` : ''}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Nacimiento</p>
              <p className="text-slate-900">{new Date(profile.birthDate).toLocaleDateString('es-AR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Membresía */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Membresía</h3>
        
        {activeMembership ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{activeMembership.plan.name}</span>
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">Activa</span>
            </div>
            <p className="text-sm text-slate-500">
              Vence: {new Date(activeMembership.endDate).toLocaleDateString('es-AR')}
            </p>
          </div>
        ) : (
          <p className="text-slate-500">No tenés una membresía activa</p>
        )}
      </div>
    </div>
  )
}