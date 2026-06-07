'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Calendar, QrCode, Bell } from 'lucide-react'
import Link from 'next/link'

interface NextClass {
  id: string
  activityName: string
  date: string
  startTime: string
  room: string | null
}

export default function ClientHomePage() {
  const { user } = useUser()
  const [nextClass, setNextClass] = useState<NextClass | null>(null)
  const [memberName, setMemberName] = useState('')

  useEffect(() => {
    // TODO: Fetch próxima clase del cliente
    // Por ahora mock
    setMemberName(user?.firstName || 'Cliente')
  }, [user])

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Hola, {memberName}!</h2>
        <p className="text-slate-500">Listo para entrenar hoy?</p>
      </div>

      {/* Próxima clase */}
      <div className="bg-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} />
          <span className="text-sm font-medium opacity-90">Próxima clase</span>
        </div>
        {nextClass ? (
          <div>
            <h3 className="text-xl font-bold">{nextClass.activityName}</h3>
            <p className="opacity-90">
              {new Date(nextClass.date).toLocaleDateString('es-AR')} · {nextClass.startTime}
            </p>
            {nextClass.room && <p className="text-sm opacity-75">Sala: {nextClass.room}</p>}
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold">No tenés clases reservadas</h3>
            <Link 
              href="/clientes/turnos"
              className="inline-block mt-2 text-sm bg-white text-blue-600 px-4 py-2 rounded-lg font-medium"
            >
              Reservar turno
            </Link>
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <Link 
          href="/clientes/turnos"
          className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition"
        >
          <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
          <span className="text-sm font-medium text-slate-700">Reservar</span>
        </Link>
        <Link 
          href="/clientes/perfil"
          className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition"
        >
          <QrCode className="mx-auto mb-2 text-blue-600" size={24} />
          <span className="text-sm font-medium text-slate-700">Mi QR</span>
        </Link>
      </div>

      {/* Notificaciones */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-slate-400" />
          <h3 className="font-semibold text-slate-700">Notificaciones</h3>
        </div>
        <p className="text-sm text-slate-500">No hay notificaciones nuevas</p>
      </div>
    </div>
  )
}