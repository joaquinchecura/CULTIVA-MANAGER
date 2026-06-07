'use client'

import { useEffect, useState } from 'react'
import { Dumbbell, Check, ChevronRight, Clock, Flame } from 'lucide-react'

interface Exercise {
  id: string
  exercise: {
    name: string
    category: string
    videoUrl: string | null
  }
  sets: number
  reps: string
  weight: number | null
  restSeconds: number | null
  notes: string | null
  completed: boolean
}

interface RoutineDay {
  id: string
  name: string
  goal: string
  estimatedDuration: number | null
  exercises: Exercise[]
}

export default function RutinaPage() {
  const [todayRoutine, setTodayRoutine] = useState<RoutineDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTodayRoutine()
  }, [])

  const fetchTodayRoutine = async () => {
    try {
      const response = await fetch('/api/clientes/rutina/hoy')
      if (response.ok) {
        const data = await response.json()
        setTodayRoutine(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExercise = (exerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const logProgress = async (exerciseId: string, setsCompleted: number, weightUsed: number) => {
    try {
      await fetch('/api/clientes/progreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId, setsCompleted, weightUsed }),
      })
      toggleExercise(exerciseId)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div className="p-4">Cargando rutina...</div>
  }

  if (!todayRoutine) {
    return (
      <div className="p-4 text-center py-12">
        <Dumbbell className="mx-auto mb-3 text-slate-300" size={48} />
        <h3 className="text-lg font-semibold text-slate-700">No hay rutina para hoy</h3>
        <p className="text-slate-500 mt-1">Descansá o contactá a tu entrenador</p>
      </div>
    )
  }

  const progress = Math.round((completedExercises.size / todayRoutine.exercises.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header de rutina */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{todayRoutine.name}</h2>
            <p className="text-sm text-slate-500 capitalize">{todayRoutine.goal.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progress}%</div>
            <p className="text-xs text-slate-500">Completado</p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {todayRoutine.estimatedDuration && (
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-2">
            <Clock size={14} />
            <span>~{todayRoutine.estimatedDuration} minutos</span>
          </div>
        )}
      </div>

      {/* Ejercicios */}
      <div className="space-y-3">
        {todayRoutine.exercises.map((exercise, index) => {
          const isCompleted = completedExercises.has(exercise.id)
          
          return (
            <div 
              key={exercise.id}
              className={`bg-white rounded-2xl p-4 border transition ${
                isCompleted ? 'border-green-300 bg-green-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  {isCompleted ? <Check size={16} /> : index + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-semibold ${isCompleted ? 'text-green-800 line-through' : 'text-slate-900'}`}>
                    {exercise.exercise.name}
                  </h3>
                  <p className="text-sm text-slate-500">{exercise.exercise.category}</p>
                  
                  <div className="flex gap-3 mt-2 text-sm">
                    <span className="text-slate-600">
                      <strong>{exercise.sets}</strong> series
                    </span>
                    <span className="text-slate-600">
                      <strong>{exercise.reps}</strong> reps
                    </span>
                    {exercise.weight && (
                      <span className="text-slate-600">
                        <strong>{exercise.weight}kg</strong>
                      </span>
                    )}
                    {exercise.restSeconds && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Flame size={12} />
                        {exercise.restSeconds}s
                      </span>
                    )}
                  </div>

                  {exercise.notes && (
                    <p className="text-xs text-slate-400 mt-1">{exercise.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => toggleExercise(exercise.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    isCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {isCompleted ? 'Hecho' : 'Completar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}