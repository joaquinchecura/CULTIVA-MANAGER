// components/routines/exercise-selector.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Exercise, mapPrismaExercise } from "@/types/exercise"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Check
} from "lucide-react"

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void
  selectedIds: string[]
  exercises?: Exercise[]
}

export function ExerciseSelector({
  onSelect,
  selectedIds,
  exercises: exercisesProp,
}: ExerciseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [fetchedExercises, setFetchedExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<string>("all")

  const exercises = exercisesProp ?? fetchedExercises

  useEffect(() => {
    if (!open || exercisesProp || fetchedExercises.length > 0) return

    let cancelled = false

    async function loadExercises() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch("/api/exercises")
        if (!res.ok) throw new Error("No se pudieron cargar los ejercicios")

        const data = await res.json()
        const raw = Array.isArray(data)
          ? data
          : data.exercises ?? data.data ?? []

        const mapped = raw.map((item: any) =>
          item?.exercise ? mapPrismaExercise(item.exercise) : mapPrismaExercise(item)
        )

        if (!cancelled) setFetchedExercises(mapped)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error al cargar los ejercicios"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadExercises()

    return () => {
      cancelled = true
    }
  }, [open, exercisesProp, fetchedExercises.length, reloadToken])

  const muscleGroups = useMemo(() => {
    return Array.from(
      new Set(
        exercises
          .map((ex) => ex.muscleGroup)
          .filter((g): g is string => Boolean(g))
      )
    ).sort()
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return exercises.filter((ex) => {
      const matchesGroup = group === "all" || ex.muscleGroup === group
      const haystack = [
        ex.name,
        ex.muscleGroup,
        (ex as any).equipment,
        (ex as any).category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return matchesGroup && (!q || haystack.includes(q))
    })
  }, [exercises, search, group])

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 gap-2"
      >
        <Plus size={15} />
        Agregar ejercicio
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* 1. Agregamos flex y flex-col al DialogContent para manejar la altura */}
        <DialogContent className="!max-w-[1100px] !w-[95vw] p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header fijo */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold">Elegir ejercicios</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Buscá por nombre, grupo muscular o equipamiento. Podés agregar varios seguidos.
                </DialogDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 shrink-0">
                {filtered.length} resultados
              </Badge>
            </div>

            <div className="relative mt-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio..."
                className="pl-10 pr-10 h-10 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap mt-4">
              <FilterChip active={group === "all"} onClick={() => setGroup("all")}>
                Todos
              </FilterChip>
              {muscleGroups.map((g) => (
                <FilterChip
                  key={g}
                  active={group === g}
                  onClick={() => setGroup(g)}
                >
                  {g}
                </FilterChip>
              ))}
            </div>
          </DialogHeader>

          {/* 2. Lista scrolleable: flex-1, overflow-y-auto y min-h-0 (clave para que flexbox scrollee bien) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 bg-slate-50/50">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Cargando ejercicios...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <p className="text-sm text-slate-600">{error}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReloadToken((t) => t + 1)}
                >
                  Reintentar
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-base font-medium text-slate-700">
                  No se encontraron ejercicios
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Probá con otra búsqueda o quitá el filtro de músculo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filtered.map((ex) => {
                  const isSelected = selectedIds.includes(ex.id)
                  const imageUrl = (ex as any).imageUrl || (ex as any).image || null

                  return (
                    <button
                      key={ex.id}
                      type="button"
                      disabled={isSelected}
                      onClick={() => onSelect(ex)}
                      className={cn(
                        "group text-left rounded-xl border p-2 transition-all flex items-center gap-3 bg-white",
                        isSelected
                          ? "border-emerald-300 bg-emerald-50/40 cursor-default"
                          : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                      )}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200/60 relative">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={ex.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={24} className="text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-1">
                        <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">
                          {ex.name}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 truncate uppercase tracking-wide">
                          {ex.muscleGroup}
                        </p>
                      </div>

                      <div className="shrink-0 mr-1">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Check size={15} />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                            <Plus size={15} />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Footer fijo (shrink-0) */}
          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-white shrink-0">
            <p className="text-sm font-medium text-slate-600">
              <span className="text-blue-600 font-bold">{selectedIds.length}</span> ejercicio(s) en esta sesión
            </p>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Listo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 h-8 rounded-full text-xs font-medium border transition-all",
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
      )}
    >
      {children}
    </button>
  )
}