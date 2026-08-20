// components/routines/routine-builder.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Exercise, mapPrismaExercise } from "@/types/exercise"
import {
  Dumbbell, Trash2, Plus, Save, ChevronUp, ChevronDown,
  X, ArrowRight, ArrowLeft, TrendingUp, Zap, Target,
  Calendar, Info, Check, Copy,   // ← agregar Copy
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
  dayOfWeek: number  // 1-based position in the week
  exercises: TemplateExercise[]
}

// weightOverrides[sessionNumber][exerciseIndex] = kg
type WeightOverrides = Record<number, Record<number, number | null>>

// ── Constants ──────────────────────────────────────────────────────────────

const GOALS = [
  { value: "HYPERTROPHY", label: "Hipertrofia" },
  { value: "STRENGTH",    label: "Fuerza" },
  { value: "ENDURANCE",   label: "Resistencia" },
  { value: "WEIGHT_LOSS", label: "Pérdida de peso" },
  { value: "MAINTENANCE", label: "Mantenimiento" },
  { value: "REHABILITATION", label: "Rehabilitación" },
]

const TOTAL_WEEKS_OPTIONS = [4, 6, 8, 10, 12]
const STEPS = [
  { id: 1, label: "Información" },
  { id: 2, label: "Sesiones" },
  { id: 3, label: "Progresión" },
]

// sessionNumber is 1-based absolute number across all weeks
function getSessionNumber(week: number, dayOfWeek: number, freq: number) {
  return (week - 1) * freq + dayOfWeek
}

// ── Component ──────────────────────────────────────────────────────────────

interface RoutineBuilderProps {
  members: { id: string; firstName: string; lastName: string }[]
  initialData?: any
}

export function RoutineBuilder({ members, initialData }: RoutineBuilderProps) {
  const router = useRouter()
  const isEditing = !!initialData

  // Step 1

  const [memberId,    setMemberId]    = useState(initialData?.memberId    || "")
  const [isTemplate, setIsTemplate] = useState(initialData?.isTemplate || false)
  const [name,        setName]        = useState(initialData?.name        || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [goal,        setGoal]        = useState(initialData?.goal        || "")
  const [freq,        setFreq]        = useState<number>(initialData?.frequencyPerWeek || 3)
  const [totalWeeks,  setTotalWeeks]  = useState<number>(initialData?.totalWeeks || 4)

  // Step 2: week template
  const buildInitialTemplate = (): TemplateSession[] => {
    if (initialData?.days) {
      const firstWeek = initialData.days.filter((d: any) => d.weekNumber === 1)
      if (firstWeek.length > 0) {
        return firstWeek.map((day: any) => ({
          dayOfWeek: day.dayOfWeek,
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
      exercises: [],
    }))
  }

  const [template, setTemplate] = useState<TemplateSession[]>(buildInitialTemplate)

  // Step 3: weight overrides per session
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

  // ── Freq change: resize template ──
  function handleFreqChange(newFreq: number) {
    setFreq(newFreq)
    setTemplate(prev => {
      if (newFreq > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: newFreq - prev.length }, (_, i) => ({
            dayOfWeek: prev.length + i + 1,
            exercises: [],
          })),
        ]
      }
      return prev.slice(0, newFreq)
    })
  }

  // ── Template manipulation ──
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

  function updateExercise(
    sIdx: number,
    exIdx: number,
    field: keyof TemplateExercise,
    value: any
  ) {
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

  // ── Weight table ──
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

  function autoFill(
    sIdx: number,
    exIdx: number,
    startWeight: number,
    increment: number,
    everyN: number
  ) {
    setWeightOverrides(prev => {
      const next = { ...prev }
      for (let week = 1; week <= totalWeeks; week++) {
        const sNum = getSessionNumber(week, sIdx + 1, freq)
        const group = Math.floor((week - 1) / everyN)
        const weight = startWeight + group * increment
        if (!next[sNum]) next[sNum] = {}
        next[sNum][exIdx] = Math.round(weight * 4) / 4  // round to nearest 0.25
      }
      return next
    })
  }

  // ── Validation ──
  const canStep1 = (isTemplate || memberId) && name.trim() && freq >= 1 && totalWeeks >= 4
  const canStep2 = template.every(s => s.exercises.length > 0)

  // ── Save ──
  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        memberId,
        name,
        description: description || null,
        goal: goal || null,
        frequencyPerWeek: freq,
        totalWeeks,
        weekTemplate: template.map(s => ({
          dayOfWeek: s.dayOfWeek,
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

  // ── Render ──
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                step === s.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : step > s.id
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-400 cursor-default"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold",
                step === s.id ? "bg-white/20" : ""
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

      {/* ══ STEP 1: Información ══ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              Información de la rutina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
          <div className="flex items-center gap-2 mb-3">
  <button
    type="button"
    onClick={() => { setIsTemplate(!isTemplate); if (!isTemplate) setMemberId("") }}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
      isTemplate
        ? "bg-violet-50 border-violet-200 text-violet-700"
        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
    )}
  >
    <Copy size={12} />
    {isTemplate ? "Es un template (sin cliente asignado)" : "Guardar como template"}
  </button>
</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {!isTemplate && (
  <div className="space-y-1.5">
    <Label>Cliente *</Label>
    <Select value={memberId} onValueChange={setMemberId}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar cliente..." />
      </SelectTrigger>
      <SelectContent>
        {members.map(m => (
          <SelectItem key={m.id} value={m.id}>
            {m.firstName} {m.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Plan fuerza — 3 meses"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Objetivo</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Objetivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Sesiones por semana *</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {[1,2,3,4,5,6,7].map(n => (
                    <button
                      key={n}
                      onClick={() => handleFreqChange(n)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-bold border transition-all",
                        freq === n
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Total de semanas *</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {TOTAL_WEEKS_OPTIONS.map(n => (
                    <button
                      key={n}
                      onClick={() => setTotalWeeks(n)}
                      className={cn(
                        "px-2.5 h-9 rounded-lg text-xs font-bold border transition-all",
                        totalWeeks === n
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      )}
                    >
                      {n} sem
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-800">
              <Calendar size={14} className="text-blue-500" />
              <strong>{freq * totalWeeks} sesiones</strong> en total
              <span className="text-blue-500">·</span>
              {freq} por semana × {totalWeeks} semanas
            </div>

            <div className="space-y-1.5">
              <Label>Descripción / notas</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Objetivo del plan, contexto, observaciones..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══ STEP 2: Sesiones ══ */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
            <Info size={15} className="shrink-0 mt-0.5" />
            <span>
              Armá las <strong>{freq} sesiones de la semana base.</strong> Los ejercicios, series y reps
              se repiten en todas las semanas. Los pesos los ajustás sesión por sesión en el paso siguiente.
            </span>
          </div>

          {template.map((session, sIdx) => (
            <Card key={sIdx}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {sIdx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-sm">Sesión {sIdx + 1}</CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Corresponde a las sesiones {Array.from({ length: totalWeeks }, (_, w) =>
                        getSessionNumber(w + 1, sIdx + 1, freq)
                      ).join(", ")} del plan completo
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {session.exercises.length} ejercicios
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.exercises.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                    Agregá al menos un ejercicio a esta sesión
                  </p>
                ) : (
                  <div className="space-y-2">
                    {session.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="border border-slate-100 rounded-xl p-3 bg-slate-50/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0 mt-0.5">
                            {exIdx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 mb-2.5 truncate">
                              {ex.exercise.name}
                              {ex.exercise.muscleGroup && (
                                <span className="text-xs text-slate-400 font-normal ml-2">
                                  {ex.exercise.muscleGroup}
                                </span>
                              )}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { label: "Series", field: "sets" as const, type: "number", placeholder: "3" },
                                { label: "Reps", field: "reps" as const, type: "text", placeholder: "10" },
                                { label: "Peso ref. (kg)", field: "targetWeight" as const, type: "number", placeholder: "—" },
                                { label: "Descanso", field: "rest" as const, type: "text", placeholder: "60s" },
                              ].map(({ label, field, type, placeholder }) => (
                                <div key={field}>
                                  <label className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                                    {label}
                                  </label>
                                  <Input
                                    type={type}
                                    min={type === "number" ? 0 : undefined}
                                    step={field === "targetWeight" ? 2.5 : undefined}
                                    value={
                                      field === "targetWeight"
                                        ? (ex.targetWeight ?? "")
                                        : (ex[field] as string | number)
                                    }
                                    onChange={e => updateExercise(
                                      sIdx, exIdx, field,
                                      field === "sets"
                                        ? parseInt(e.target.value) || 1
                                        : field === "targetWeight"
                                        ? (e.target.value ? parseFloat(e.target.value) : null)
                                        : e.target.value
                                    )}
                                    className="h-8 text-sm text-center mt-1"
                                    placeholder={placeholder}
                                  />
                                </div>
                              ))}
                            </div>
                            <Input
                              value={ex.notes}
                              onChange={e => updateExercise(sIdx, exIdx, "notes", e.target.value)}
                              className="h-7 text-xs mt-2"
                              placeholder="Nota del coach para este ejercicio..."
                            />
                          </div>
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              onClick={() => moveExercise(sIdx, exIdx, "up")}
                              disabled={exIdx === 0}
                              className="p-1.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              onClick={() => moveExercise(sIdx, exIdx, "down")}
                              disabled={exIdx === session.exercises.length - 1}
                              className="p-1.5 rounded text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown size={13} />
                            </button>
                            <button
                              onClick={() => removeExercise(sIdx, exIdx)}
                              className="p-1.5 rounded text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <ExerciseSelector
                  onSelect={ex => addExercise(sIdx, ex)}
                  selectedIds={session.exercises.map(e => e.exerciseId)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ STEP 3: Progresión de pesos ══ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <TrendingUp size={15} className="shrink-0 mt-0.5" />
            <span>
              Ajustá el <strong>peso prescripto</strong> para cada sesión. Las celdas grises usan el
              peso de referencia del template; las azules tienen un valor personalizado.
              Usá <strong>Auto-fill</strong> para generar progresión automática.
            </span>
          </div>

          {template.map((session, sIdx) => {
            if (session.exercises.length === 0) return null
            return (
              <Card key={sIdx} className="overflow-hidden">
                <CardHeader className="py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {sIdx + 1}
                    </div>
                    <CardTitle className="text-sm">Sesión {sIdx + 1} de la semana</CardTitle>
                    <span className="text-xs text-slate-400 ml-1">
                      → {totalWeeks} apariciones: ses. {Array.from({ length: totalWeeks }, (_, w) =>
                        getSessionNumber(w + 1, sIdx + 1, freq)
                      ).join(" · ")}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="sticky left-0 bg-white text-left px-4 py-2.5 text-xs font-semibold text-slate-500 min-w-[160px] border-r border-slate-100">
                            Ejercicio
                          </th>
                          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                            const sNum = getSessionNumber(w, sIdx + 1, freq)
                            return (
                              <th key={w} className="text-center px-2 py-2 min-w-[72px]">
                                <div className="text-xs font-semibold text-slate-600">Sem {w}</div>
                                <div className="text-[9px] font-normal text-slate-400">Ses {sNum}</div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {session.exercises.map((ex, exIdx) => (
                          <tr key={exIdx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="sticky left-0 bg-white px-4 py-2.5 border-r border-slate-100">
                              <p className="text-xs font-medium text-slate-900 truncate max-w-[140px]">
                                {ex.exercise.name}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {ex.sets}×{ex.reps}
                                {ex.rest && ` · ${ex.rest}`}
                              </p>
                            </td>
                            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
                              const sNum = getSessionNumber(w, sIdx + 1, freq)
                              const val = getWeight(sNum, exIdx, ex)
                              const isCustom = weightOverrides[sNum]?.[exIdx] !== undefined
                              return (
                                <td key={w} className="px-1.5 py-1.5 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    step={2.5}
                                    value={val ?? ""}
                                    onChange={e => setWeight(
                                      sNum, exIdx,
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )}
                                    placeholder="—"
                                    className={cn(
                                      "w-16 h-8 text-center text-xs rounded-lg border outline-none",
                                      "focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all",
                                      isCustom
                                        ? "border-blue-300 bg-blue-50 text-blue-800 font-semibold"
                                        : "border-slate-200 bg-slate-50 text-slate-500"
                                    )}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Auto-fill */}
                  <AutoFillBar
                    session={session}
                    sIdx={sIdx}
                    freq={freq}
                    totalWeeks={totalWeeks}
                    onAutoFill={autoFill}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}
        >
          <ArrowLeft size={15} className="mr-1.5" />
          {step === 1 ? "Cancelar" : "Atrás"}
        </Button>

        <div className="flex items-center gap-3">
          {step === 2 && !canStep2 && (
            <p className="text-xs text-amber-600">
              Cada sesión necesita al menos un ejercicio
            </p>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? !canStep1 : !canStep2}
            >
              Siguiente
              <ArrowRight size={15} className="ml-1.5" />
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

// ── Auto-fill bar ──────────────────────────────────────────────────────────

function AutoFillBar({
  session, sIdx, freq, totalWeeks, onAutoFill,
}: {
  session: TemplateSession
  sIdx: number
  freq: number
  totalWeeks: number
  onAutoFill: (sIdx: number, exIdx: number, start: number, inc: number, every: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [exIdx, setExIdx] = useState(0)
  const [startWeight, setStartWeight] = useState<number>(
    session.exercises[0]?.targetWeight ?? 60
  )
  const [increment, setIncrement] = useState<number>(2.5)
  const [everyN, setEveryN] = useState<number>(2)

  if (session.exercises.length === 0) return null

  return (
    <div className="border-t border-slate-100 px-4 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
      >
        <Zap size={12} />
        {open ? "Cerrar auto-fill" : "Auto-fill progresión"}
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap items-end gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <div>
            <label className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide">
              Ejercicio
            </label>
            <select
              value={exIdx}
              onChange={e => {
                const i = Number(e.target.value)
                setExIdx(i)
                setStartWeight(session.exercises[i]?.targetWeight ?? 60)
              }}
              className="mt-1 block h-8 px-2 text-xs border border-blue-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {session.exercises.map((ex, i) => (
                <option key={i} value={i}>{ex.exercise.name}</option>
              ))}
            </select>
          </div>

          {[
            { label: "Peso inicial (kg)", val: startWeight, setter: setStartWeight, step: 2.5, w: "w-24" },
            { label: "Incremento (kg)",   val: increment,   setter: setIncrement,   step: 2.5, w: "w-20" },
            { label: "Cada N semanas",    val: everyN,      setter: setEveryN,      step: 1,   w: "w-16" },
          ].map(({ label, val, setter, step, w }) => (
            <div key={label}>
              <label className="text-[10px] text-blue-700 font-semibold uppercase tracking-wide">
                {label}
              </label>
              <input
                type="number"
                min={0}
                step={step}
                value={val}
                onChange={e => setter(parseFloat(e.target.value) || 0)}
                className={cn(
                  "mt-1 block h-8 text-center text-xs border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400",
                  w
                )}
              />
            </div>
          ))}

          <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-lg leading-snug max-w-[200px]">
            {startWeight}kg → {startWeight + Math.floor(totalWeeks / everyN) * increment}kg
            {" "}en {totalWeeks} semanas
          </div>

          <Button
            size="sm"
            onClick={() => {
              onAutoFill(sIdx, exIdx, startWeight, increment, everyN)
              setOpen(false)
            }}
            className="h-8 text-xs gap-1.5"
          >
            <Zap size={12} /> Aplicar
          </Button>
        </div>
      )}
    </div>
  )
}