export const dynamic = "force-dynamic"

import { getRoutines, getTemplates } from "@/app/actions/routines"
import { RoutineActions } from "@/components/routines/routine-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Dumbbell, Plus, Search, Calendar, Users, Target,
  Filter, Copy, FileText, TrendingUp, ChevronRight
} from "lucide-react"
import Link from "next/link"

const goalLabels: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia", STRENGTH: "Fuerza", ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de peso", MAINTENANCE: "Mantenimiento", REHABILITATION: "Rehabilitación",
}

const goalColors: Record<string, string> = {
  HYPERTROPHY: "bg-blue-50 text-blue-700 border-blue-200",
  STRENGTH: "bg-red-50 text-red-700 border-red-200",
  ENDURANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WEIGHT_LOSS: "bg-orange-50 text-orange-700 border-orange-200",
  MAINTENANCE: "bg-violet-50 text-violet-700 border-violet-200",
  REHABILITATION: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    goal?: string
    status?: string
    view?: string
  }>
}) {
  const params = await searchParams

  const routines = params.view === "templates"
    ? await getTemplates()
    : await getRoutines(params.search)

  const filteredRoutines = routines.filter((r: any) => {
    const matchesGoal   = !params.goal   || r.goal     === params.goal
    const matchesStatus = !params.status || (params.status === "active" ? r.isActive : !r.isActive)
    return matchesGoal && matchesStatus
  })

  const stats = {
    total:    routines.length,
    active:   routines.filter((r: any) => r.isActive).length,
    inactive: routines.filter((r: any) => !r.isActive).length,
    byGoal:   routines.reduce((acc: any, r: any) => {
      if (r.goal) acc[r.goal] = (acc[r.goal] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }

  const isTemplateView = params.view === "templates"

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header compacto */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell size={22} className="text-blue-600" />
            Rutinas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.total} {isTemplateView ? "templates" : "rutinas"} · {stats.active} activas
          </p>
        </div>
        {isTemplateView ? (
          <Link href="/admin/rutinas/nueva?template=true">
            <Button className="gap-2 shrink-0">
              <Plus size={16} /> Nuevo template
            </Button>
          </Link>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Link href="/admin/rutinas/nueva">
              <Button variant="outline" className="gap-2">
                <Plus size={16} /> Rutina manual
              </Button>
            </Link>
            <Link href="/admin/rutinas/generar">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus size={16} /> Rutina automática
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-blue-600" />
            <span className="text-xs text-slate-500 font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-600" />
            <span className="text-xs text-slate-500 font-medium">Activas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-violet-600" />
            <span className="text-xs text-slate-500 font-medium">Objetivos</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{Object.keys(stats.byGoal).length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-orange-600" />
            <span className="text-xs text-slate-500 font-medium">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">
            {isTemplateView ? "—" : new Set(routines.map((r: any) => r.memberId).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        <Link href="/admin/rutinas">
          <button className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            !isTemplateView ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          )}>
            Rutinas asignadas
          </button>
        </Link>
        <Link href="/admin/rutinas?view=templates">
          <button className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
            isTemplateView ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
          )}>
            <Copy size={14} /> Templates
          </button>
        </Link>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            name="search"
            defaultValue={params.search}
            placeholder={isTemplateView ? "Buscar template..." : "Buscar por nombre o cliente..."}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {isTemplateView && <input type="hidden" name="view" value="templates" />}
        <select name="goal" defaultValue={params.goal || ""} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600">
          <option value="">Todos los objetivos</option>
          {Object.entries(goalLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {!isTemplateView && (
          <select name="status" defaultValue={params.status || ""} className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600">
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        )}
        <Button type="submit" variant="outline" size="sm" className="h-9 gap-1.5">
          <Filter size={14} /> Filtrar
        </Button>
        {(params.search || params.goal || params.status) && (
          <Link href={isTemplateView ? "/admin/rutinas?view=templates" : "/admin/rutinas"}>
            <Button type="button" variant="ghost" size="sm" className="h-9 text-slate-500">Limpiar</Button>
          </Link>
        )}
      </form>

      {/* Listado */}
      {filteredRoutines.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Dumbbell className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">{isTemplateView ? "No hay templates" : "No hay rutinas"}</p>
          <p className="text-sm text-slate-400 mt-1">
            {params.search || params.goal
              ? "Probá con otros filtros"
              : isTemplateView
              ? "Creá un template genérico para reutilizar con varios clientes"
              : "Creá la primera rutina para un cliente"}
          </p>
          <Link href={isTemplateView ? "/admin/rutinas/nueva?template=true" : "/admin/rutinas/generar"} className="inline-block mt-4">
            <Button size="sm" className="gap-2">
              <Plus size={16} /> {isTemplateView ? "Nuevo template" : "Rutina automática"}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredRoutines.map((routine: any) => {
            const totalExercises = routine.days.reduce((sum: number, d: any) => sum + d.exercises.length, 0)
            const goalStyle = routine.goal ? goalColors[routine.goal] : "bg-slate-50 text-slate-600 border-slate-200"

            return (
              <Link
                key={routine.id}
                href={`/admin/rutinas/${routine.id}`}
                className={cn(
                  "group block bg-white border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
                  routine.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isTemplateView && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          <Copy size={10} /> TEMPLATE
                        </span>
                      )}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {routine.name}
                      </h3>
                      {routine.goal && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${goalStyle}`}>
                          {goalLabels[routine.goal] || routine.goal}
                        </span>
                      )}
                      {!routine.isActive && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Inactiva
                        </span>
                      )}
                    </div>

                    {routine.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{routine.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {routine.frequencyPerWeek && `${routine.frequencyPerWeek} ses/sem`}
                        {routine.totalWeeks && ` · ${routine.totalWeeks} sem`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell size={12} className="text-slate-400" />
                        {totalExercises} ejercicios
                      </span>
                      {!isTemplateView && routine.member && (
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          {routine.member.firstName} {routine.member.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <RoutineActions routineId={routine.id} isActive={routine.isActive} routineName={routine.name} />
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}