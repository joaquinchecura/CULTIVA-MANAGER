// components/routines/routine-builder.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createRoutine, updateRoutine } from "@/app/actions/routines"
import { ExerciseSelector } from "./exercise-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Exercise, mapPrismaExercise } from "@/types/exercise"
import {
  Trash2, Save, ChevronUp, ChevronDown,
  ArrowRight, ArrowLeft, TrendingUp, Zap, Target,
  Calendar, Info, Check, Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────

interface TemplateExercise {
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: string
  targetWeight: number | null
  rest: string
  notes: string
  order: number
}

interface TemplateSession {
  dayOfWeek: number
  label: string
  exercises: TemplateExercise[]
}

type WeightOverrides = Record<number, Record<number, number | null>>

// ── Constants ──────────────────────────────────────────────────────────────

const GOALS = [
  { value: "HYPERTROPHY", label: "Hipertrofia", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "STRENGTH",    label: "Fuerza", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "ENDURANCE",   label: "Resistencia", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "WEIGHT_LOSS", label: "Pérdida de peso", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "MAINTENANCE", label: "Mantenimiento", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "REHABILITATION", label: "Rehabilitación", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
]

const TOTAL_WEEKS_OPTIONS = [4, 6, 8, 10, 12]
const STEPS = [
  { id: 1, label: "Información" },
  { id: 2, label: "Sesiones" },
  { id: 3, label: "Progresión" },
]

function getSessionNumber(week: number, dayOfWeek: number, freq: number) {
  return (week - 1) * freq + dayOfWeek
}

// ── Component ──────────────────────────────────────────────────────────────

interface RoutineBuilderProps {
  members: { id: string; firstName: string; lastName: string }[]
  initialData?: any
  defaultMemberId?: string
}

export function RoutineBuilder({ members, initialData, defaultMemberId }: RoutineBuilderProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [memberId, setMemberId] = useState(initialData?.memberId || defaultMemberId || "")
  const searchParams = useSearchParams()
  const templateFromQuery = searchParams.get("template") === "true"
  const [isTemplate, setIsTemplate] = useState(initialData?.isTemplate || templateFromQuery)
  const [name,        setName]        = useState(initialData?.name        || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [goal,        setGoal]        = useState(initialData?.goal        || "")
  const [freq,        setFreq]        = useState<number>(initialData?.frequencyPerWeek || 3)
  const [totalWeeks,  setTotalWeeks]  = useState<number>(initialData?.totalWeeks || 4)

  const buildInitialTemplate = (): TemplateSession[] => {
    if (initialData?.days) {
      const firstWeek = initialData.days.filter((d: any) => d.weekNumber === 1)
      if (firstWeek.length > 0) {
        return firstWeek.map((day: any) => ({
          dayOfWeek: day.dayOfWeek,
          label: day.dayName?.includes(' — ') ? day.dayName.split(' — ')[1] : '',
          exercises: day.exercises.map((ex: any, idx: number) => ({
            exerciseId: ex.exerciseId,
            exercise: mapPrismaExercise(ex.exercise),
            sets: ex.sets,
            reps: ex.reps,
            targetWeight: ex.targetWeight ?? null,
            rest: ex.rest || "",
            notes: ex.notes || "",
            order: idx,
          })),
        }))
      }
    }
    return Array.from({ length: freq }, (_, i) => ({
      dayOfWeek: i + 1,
      label: '',
      exercises: [],
    }))
  }

  const [template, setTemplate] = useState<TemplateSession[]>(buildInitialTemplate)

  const buildInitialOverrides = (): WeightOverrides => {
    if (initialData?.days) {
      const overrides: WeightOverrides = {}
      initialData.days.forEach((day: any) => {
        day.exercises.forEach((ex: any, idx: number) => {
          if (!overrides[day.sessionNumber]) overrides[day.sessionNumber] = {}
          overrides[day.sessionNumber][idx] = ex.targetWeight ?? null
        })
      })
      return overrides
    }
    return {}
  }

  const [weightOverrides, setWeightOverrides] = useState<WeightOverrides>(buildInitialOverrides)
  const [step,   setStep]   = useState(1)
  const [saving, setSaving] = useState(false)

  function handleFreqChange(newFreq: number) {
    setFreq(newFreq)
    setTemplate(prev => {
      if (newFreq > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: newFreq - prev.length }, (_, i) => ({
            dayOfWeek: prev.length + i + 1,
            label: '',
            exercises: [],
          })),
        ]
      }
      return prev.slice(0, newFreq)
    })
  }

  function updateSessionLabel(sIdx: number, label: string) {
    setTemplate(prev => {
      const next = [...prev]
      next[sIdx] = { ...next[sIdx], label }
      return next
    })
  }

  function addExercise(sIdx: number, exercise: Exercise) {
    setTemplate(prev => {
      const next = [...prev]
      next[sIdx] = {
        ...next[sIdx],
        exercises: [
          ...next[sIdx].exercises,
          {
            exerciseId: exercise.id,
            exercise,
            sets: 3,
            reps: "10",
            targetWeight: null,
            rest: "60s",
            notes: "",
            order: next[sIdx].exercises.length,
          },
        ],
      }
      return next
    })
  }

  function removeExercise(sIdx: number, exIdx: number) {
    setTemplate(prev => {
      const next = [...prev]
      next[sIdx] = {
        ...next[sIdx],
        exercises: next[sIdx].exercises
          .filter((_, i) => i !== exIdx)
          .map((ex, i) => ({ ...ex, order: i })),
      }
      return next
    })
  }

  function updateExercise(sIdx: number, exIdx: number, field: keyof TemplateExercise, value: any) {
    setTemplate(prev => {
      const next = [...prev]
      const exs = [...next[sIdx].exercises]
      exs[exIdx] = { ...exs[exIdx], [field]: value }
      next[sIdx] = { ...next[sIdx], exercises: exs }
      return next
    })
  }

  function moveExercise(sIdx: number, exIdx: number, dir: "up" | "down") {
    const exs = template[sIdx].exercises
    if (dir === "up" && exIdx === 0) return
    if (dir === "down" && exIdx === exs.length - 1) return
    setTemplate(prev => {
      const next = [...prev]
      const exercises = [...next[sIdx].exercises]
      const tmp = exercises[exIdx]
      const swapIdx = dir === "up" ? exIdx - 1 : exIdx + 1
      exercises[exIdx] = exercises[swapIdx]
      exercises[swapIdx] = tmp
      next[sIdx] = {
        ...next[sIdx],
        exercises: exercises.map((ex, i) => ({ ...ex, order: i })),
      }
      return next
    })
  }

  function getWeight(sNum: number, exIdx: number, templateEx: TemplateExercise) {
    if (weightOverrides[sNum]?.[exIdx] !== undefined) {
      return weightOverrides[sNum][exIdx]
    }
    return templateEx.targetWeight
  }

  function setWeight(sNum: number, exIdx: number, value: number | null) {
    setWeightOverrides(prev => ({
      ...prev,
      [sNum]: { ...(prev[sNum] || {}), [exIdx]: value },
    }))
  }

  function autoFill(sIdx: number, exIdx: number, startWeight: number, increment: number, everyN: number) {
    setWeightOverrides(prev => {
      const next = { ...prev }
      for (let week = 1; week <= totalWeeks; week++) {
        const sNum = getSessionNumber(week, sIdx + 1, freq)
        const group = Math.floor((week - 1) / everyN)
        const weight = startWeight + group * increment
        if (!next[sNum]) next[sNum] = {}
        next[sNum][exIdx] = Math.round(weight * 4) / 4
      }
      return next
    })
  }

  const canStep1 = (isTemplate || memberId) && name.trim() && freq >= 1 && totalWeeks >= 4
  const canStep2 = template.every(s => s.exercises.length > 0)

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        memberId: isTemplate ? null : memberId,
        isTemplate,
        name,
        description: description || null,
        goal: goal || null,
        frequencyPerWeek: freq,
        totalWeeks,
        weekTemplate: template.map(s => ({
          dayOfWeek: s.dayOfWeek,
          label: s.label || undefined,
          exercises: s.exercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            targetWeight: ex.targetWeight,
            rest: ex.rest || null,
            order: idx,
            notes: ex.notes || null,
          })),
        })),
        weightOverrides,
      }
      if (isEditing) {
        await updateRoutine(initialData.id, payload)
      } else {
        await createRoutine(payload)
      }
      router.push("/admin/rutinas")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Error al guardar la rutina")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                step === s.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : step > s.id
                  ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  : "bg-slate-50 text-slate-400 cursor-default"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                step === s.id ? "bg-white/20" : step > s.id ? "bg-blue-100" : ""
              )}>
                {step > s.id ? <Check size={10} /> : s.id}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-6", step > s.id ? "bg-blue-300" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: Información */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
              <Target size={20} className="text-blue-600" />
              Detalles del plan
            </h2>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setIsTemplate(!isTemplate); if (!isTemplate) setMemberId("") }}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                    isTemplate
                      ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                  )}
                >
                  <Copy size={16} />
                  {isTemplate ? "Modo Template (Sin cliente)" : "Guardar como template genérico"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {!isTemplate && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Cliente asignado <span className="text-red-500">*</span></Label>
                    <Select value={memberId} onValueChange={setMemberId}>
                      <SelectTrigger className="h-10 bg-slate-50/50">
                        <SelectValue placeholder="Seleccionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nombre de la rutina <span className="text-red-500">*</span></Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Plan Hipertrofia — Mes 1"
                    className="h-10 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Descripción o notas del coach</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contexto del plan, lesiones previas, observaciones..."
                  rows={2}
                  className="bg-slate-50/50 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-6">
              <Calendar size={20} className="text-blue-600" />
              Objetivo y estructura
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Objetivo principal</Label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map(g => (
                      <button
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                          goal === g.value
                            ? g.color + " ring-2 ring-offset-1 ring-slate-200 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Días de entrenamiento por semana <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,3,4,5,6,7].map(n => (
                      <button
                        key={n}
                        onClick={() => handleFreqChange(n)}
                        className={cn(
                          "w-11 h-11 rounded-lg text-base font-bold border transition-all flex items-center justify-center",
                          freq === n
                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Duración del plan</Label>
                  <div className="flex gap-2 flex-wrap">
                    {TOTAL_WEEKS_OPTIONS.map(n => (
                      <button
                        key={n}
                        onClick={() => setTotalWeeks(n)}
                        className={cn(
                          "px-4 h-10 rounded-lg text-sm font-bold border transition-all flex items-center justify-center",
                          totalWeeks === n
                            ? "bg-slate-800 text-white border-slate-800 shadow-md"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {n} semanas
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
                  <Calendar className="absolute -right-4 -bottom-4 text-blue-500/10 w-32 h-32" />
                  <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-blue-500" />
                    Resumen del plan
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div>
                      <p className="text-3xl font-black text-blue-700">{freq * totalWeeks}</p>
                      <p className="text-xs text-blue-600/80 font-medium uppercase tracking-wide">Sesiones totales</p>
                    </div>
                    <div className="pt-4 border-t border-blue-200/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800/70">Frecuencia:</span>
                        <span className="font-semibold text-blue-900">{freq} días/sem</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800/70">Duración:</span>
                        <span className="font-semibold text-blue-900">{totalWeeks} semanas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Sesiones */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200/60 rounded-xl text-sm text-amber-900 shadow-sm">
            <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Armá las <strong>{freq} sesiones de la semana base.</strong> Los ejercicios, series y reps
              se repiten en todas las semanas. Los pesos los ajustás sesión por sesión en el paso siguiente.
            </span>
          </div>

          {template.map((session, sIdx) => (
            <div key={sIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                  {sIdx + 1}
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-slate-900">Sesión {sIdx + 1}</h3>
                    <Badge variant="secondary" className="text-[11px] bg-white border-slate-200 text-slate-600 shadow-sm">
                      {session.exercises.length} ejercicios
                    </Badge>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">
                    Apariciones: Sesiones {Array.from({ length: totalWeeks }, (_, w) =>
                      getSessionNumber(w + 1, sIdx + 1, freq)
                    ).join(", ")} del plan
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  <Input
                    value={session.label}
                    onChange={e => updateSessionLabel(sIdx, e.target.value)}
                    placeholder="Ej: Push, Pull, Legs..."
                    className="h-9 text-sm w-full sm:w-56 bg-white"
                  />
                </div>
              </div>

              <div className="p-5 space-y-4">
                {session.exercises.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-500">
                      No hay ejercicios en esta sesión todavía.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hacé clic abajo para empezar a agregar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {session.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-white hover:border-blue-300 transition-colors group/ex">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 border border-blue-100">
                            {exIdx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {ex.exercise.name}
                              </p>
                              {ex.exercise.muscleGroup && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                  {ex.exercise.muscleGroup}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: "Series", field: "sets" as const, type: "number", placeholder: "3" },
                                { label: "Reps", field: "reps" as const, type: "text", placeholder: "10" },
                                { label: "Peso (kg)", field: "targetWeight" as const, type: "number", placeholder: "—" },
                                { label: "Descanso", field: "rest" as const, type: "text", placeholder: "60s" },
                              ].map(({ label, field, type, placeholder }) => (
                                <div key={field} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                                    {label}
                                  </label>
                                  <Input
                                    type={type}
                                    min={type === "number" ? 0 : undefined}
                                    step={field === "targetWeight" ? 2.5 : undefined}
                                    value={field === "targetWeight" ? (ex.targetWeight ?? "") : (ex[field] as string | number)}
                                    onChange={e => updateExercise(sIdx, exIdx, field,
                                      field === "sets"
                                        ? parseInt(e.target.value) || 1
                                        : field === "targetWeight"
                                        ? (e.target.value ? parseFloat(e.target.value) : null)
                                        : e.target.value
                                    )}
                                    className="h-8 text-sm text-center bg-white border-slate-200 font-medium"
                                    placeholder={placeholder}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-400 shrink-0">Nota:</span>
                              <Input
                                value={ex.notes}
                                onChange={e => updateExercise(sIdx, exIdx, "notes", e.target.value)}
                                className="h-8 text-xs bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-300 transition-all text-slate-600 placeholder:text-slate-300"
                                placeholder="Indicaciones extra para este ejercicio..."
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-100 opacity-50 group-hover/ex:opacity-100 transition-opacity">
                            <button
                              onClick={() => moveExercise(sIdx, exIdx, "up")}
                              disabled={exIdx === 0}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white disabled:opacity-30 transition-colors"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => moveExercise(sIdx, exIdx, "down")}
                              disabled={exIdx === session.exercises.length - 1}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white disabled:opacity-30 transition-colors"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <div className="h-px w-full bg-slate-200 my-0.5" />
                            <button
                              onClick={() => removeExercise(sIdx, exIdx)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-white transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <ExerciseSelector
                    onSelect={ex => addExercise(sIdx, ex)}
                    selectedIds={session.exercises.map(e => e.exerciseId)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 3: Progresión */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-200/60 rounded-xl text-sm text-blue-900 shadow-sm">
            <TrendingUp size={18} className="shrink-0 mt-0.5 text-blue-600" />
            <span>
              Ajustá el <strong>peso prescripto</strong> para cada sesión. Las celdas grises usan el
              peso de referencia del template; las azules tienen un valor personalizado.
              Usá <strong>Auto-fill</strong> para generar progresión automática.
            </span>
          </div>

          {template.map((session, sIdx) => {
            if (session.exercises.length === 0) return null
            return (
              <div key={sIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                    {sIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Progresión: Sesión {sIdx + 1}</h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Ajustá las cargas de cada semana para esta sesión
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white">
                        <th className="sticky left-0 bg-white text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px] border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                          Ejercicio
                        </th>
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                          const sNum = getSessionNumber(w, sIdx + 1, freq)
                          return (
                            <th key={w} className="text-center px-2 py-3 min-w-[80px]">
                              <div className="text-xs font-bold text-slate-800">Sem {w}</div>
                              <div className="text-[10px] font-medium text-slate-400 mt-0.5">Ses {sNum}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {session.exercises.map((ex, exIdx) => (
                        <tr key={exIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors group/row">
                          <td className="sticky left-0 bg-white group-hover/row:bg-slate-50/90 px-5 py-3 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 transition-colors">
                            <p className="text-[13px] font-bold text-slate-900 truncate max-w-[180px]">
                              {ex.exercise.name}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{ex.sets}×{ex.reps}</span>
                              {ex.rest && <span>{ex.rest}</span>}
                            </p>
                          </td>
                          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                            const sNum = getSessionNumber(w, sIdx + 1, freq)
                            const val = getWeight(sNum, exIdx, ex)
                            const isCustom = weightOverrides[sNum]?.[exIdx] !== undefined
                            return (
                              <td key={w} className="px-2 py-2 text-center align-middle">
                                <div className="relative group/input flex items-center justify-center">
                                  <input
                                    type="number"
                                    min={0}
                                    step={2.5}
                                    value={val ?? ""}
                                    onChange={e => setWeight(sNum, exIdx, e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="—"
                                    className={cn(
                                      "w-16 h-9 text-center text-[13px] rounded-lg border outline-none transition-all font-semibold",
                                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white shadow-sm",
                                      isCustom
                                        ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300"
                                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white"
                                    )}
                                  />
                                  <span className="absolute right-1.5 text-[9px] font-bold text-slate-400 pointer-events-none group-focus-within/input:opacity-0 transition-opacity">
                                    kg
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 p-3">
                  <AutoFillBar
                    session={session}
                    sIdx={sIdx}
                    freq={freq}
                    totalWeeks={totalWeeks}
                    onAutoFill={autoFill}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}>
          <ArrowLeft size={15} className="mr-1.5" />
          {step === 1 ? "Cancelar" : "Atrás"}
        </Button>

        <div className="flex items-center gap-3">
          {step === 2 && !canStep2 && (
            <p className="text-xs text-amber-600">Cada sesión necesita al menos un ejercicio</p>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 ? !canStep1 : !canStep2}>
              Siguiente <ArrowRight size={15} className="ml-1.5" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={15} />
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear rutina"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Auto-fill bar (una sola definición, a nivel de módulo) ─────────────────

function AutoFillBar({
  session, sIdx, totalWeeks, onAutoFill,
}: {
  session: TemplateSession
  sIdx: number
  freq: number
  totalWeeks: number
  onAutoFill: (sIdx: number, exIdx: number, start: number, inc: number, every: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [exIdx, setExIdx] = useState(0)
  const [startWeight, setStartWeight] = useState<number>(session.exercises[0]?.targetWeight ?? 60)
  const [increment, setIncrement] = useState<number>(2.5)
  const [everyN, setEveryN] = useState<number>(2)

  if (session.exercises.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50/50 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className={open ? "text-blue-500" : "text-amber-500"} />
          {open ? "Cerrar generador automático" : "Generar progresión automática (Auto-fill)"}
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-end gap-4 p-4 bg-white border border-blue-100 rounded-xl shadow-sm">
            <div className="w-full sm:w-auto">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Ejercicio a modificar</label>
              <select
                value={exIdx}
                onChange={e => {
                  const i = Number(e.target.value)
                  setExIdx(i)
                  setStartWeight(session.exercises[i]?.targetWeight ?? 60)
                }}
                className="block w-full sm:w-48 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                {session.exercises.map((ex, i) => (
                  <option key={i} value={i}>{ex.exercise.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Peso inicial</label>
              <div className="relative">
                <input
                  type="number" min={0} step={2.5} value={startWeight}
                  onChange={e => setStartWeight(parseFloat(e.target.value) || 0)}
                  className="block w-24 h-9 pl-2 pr-6 text-center text-sm border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">kg</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Incremento</label>
              <div className="relative">
                <input
                  type="number" min={0} step={2.5} value={increment}
                  onChange={e => setIncrement(parseFloat(e.target.value) || 0)}
                  className="block w-20 h-9 pl-2 pr-6 text-center text-sm border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">kg</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Cada N semanas</label>
              <input
                type="number" min={1} step={1} value={everyN}
                onChange={e => setEveryN(parseFloat(e.target.value) || 1)}
                className="block w-16 h-9 text-center text-sm border border-slate-200 rounded-lg bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div className="flex-1"></div>

            <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg font-medium border border-blue-100 flex items-center gap-2">
              <TrendingUp size={14} />
              {startWeight}kg → {startWeight + Math.floor(totalWeeks / everyN) * increment}kg
            </div>

            <Button
              size="sm"
              onClick={() => { onAutoFill(sIdx, exIdx, startWeight, increment, everyN); setOpen(false) }}
              className="h-9 px-6 bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-sm"
            >
              <Zap size={14} className="text-amber-400" /> Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}