'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Calendar, QrCode, Bell, Dumbbell, Clock } from 'lucide-react'
import Link from 'next/link'

interface NextClass {
  id: string
  schedule: {
    date: string
    startTime: string
    endTime: string
    room: string | null
    activity: {
      name: string
    }
  }
}

interface TodayRoutine {
  id: string
  name: string
  exercisesCount: number
}

export default function ClientHomePage() {
  const { user } = useUser()
  const [nextClass, setNextClass] = useState<NextClass | null>(null)
  const [todayRoutine, setTodayRoutine] = useState<TodayRoutine | null>(null)
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setMemberName(user.firstName || 'Cliente')
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch próxima clase
      const classResponse = await fetch('/api/clientes/proxima-clase')
      if (classResponse.ok) {
        const classData = await classResponse.json()
        setNextClass(classData)
      }

      // Fetch rutina de hoy
      const routineResponse = await fetch('/api/clientes/rutina/hoy')
      if (routineResponse.ok) {
        const routineData = await routineResponse.json()
        if (routineData) {
          setTodayRoutine({
            id: routineData.id,
            name: routineData.name,
            exercisesCount: routineData.exercises.length,
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Cargando...</div>
  }

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">¡Hola, {memberName}!</h2>
        <p className="text-slate-500">Listo para entrenar hoy?</p>
      </div>

      {/* Próxima clase */}
      <div className="bg-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} />
          <span className="text-sm font-medium opacity-90">Próxima clase</span>
        </div>
        
        {nextClass ? (
          <div>
            <h3 className="text-xl font-bold">{nextClass.schedule.activity.name}</h3>
            <div className="flex items-center gap-1 mt-1 opacity-90">
              <Clock size={14} />
              <span>
                {new Date(nextClass.schedule.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })} · {nextClass.schedule.startTime}
              </span>
            </div>
            {nextClass.schedule.room && (
              <p className="text-sm opacity-75 mt-1">Sala: {nextClass.schedule.room}</p>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold">No tenés clases reservadas</h3>
            <Link 
              href="/clientes/turnos"
              className="inline-block mt-3 text-sm bg-white text-blue-600 px-4 py-2 rounded-lg font-medium"
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
          className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition active:scale-95"
        >
          <Calendar className="mx-auto mb-2 text-blue-600" size={24} />
          <span className="text-sm font-medium text-slate-700">Reservar</span>
        </Link>
        
        <Link 
          href="/clientes/rutina"
          className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition active:scale-95"
        >
          <Dumbbell className="mx-auto mb-2 text-blue-600" size={24} />
          <span className="text-sm font-medium text-slate-700">Rutina</span>
          {todayRoutine && (
            <span className="block text-xs text-slate-400 mt-1">{todayRoutine.exercisesCount} ejercicios</span>
          )}
        </Link>
        
        <Link 
          href="/clientes/perfil"
          className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition active:scale-95"
        >
          <QrCode className="mx-auto mb-2 text-blue-600" size={24} />
          <span className="text-sm font-medium text-slate-700">Mi QR</span>
        </Link>
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <Bell className="mx-auto mb-2 text-slate-400" size={24} />
          <span className="text-sm font-medium text-slate-500">Notificaciones</span>
          <span className="block text-xs text-slate-400 mt-1">0 nuevas</span>
        </div>
      </div>
    </div>
  )
}