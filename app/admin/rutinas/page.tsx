export const dynamic = "force-dynamic";

import { getRoutines } from "@/app/actions/routines";
import { RoutineActions } from "@/components/routines/routine-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dumbbell, Plus, Search, Calendar, Users, Target,
  Filter, Copy, FileText, TrendingUp
} from "lucide-react";
import Link from "next/link";

const goalLabels: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia",
  STRENGTH: "Fuerza",
  ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de peso",
  MAINTENANCE: "Mantenimiento",
  REHABILITATION: "Rehabilitación",
};

const goalColors: Record<string, string> = {
  HYPERTROPHY: "bg-blue-50 text-blue-700 border-blue-200",
  STRENGTH: "bg-red-50 text-red-700 border-red-200",
  ENDURANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WEIGHT_LOSS: "bg-orange-50 text-orange-700 border-orange-200",
  MAINTENANCE: "bg-purple-50 text-purple-700 border-purple-200",
  REHABILITATION: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; goal?: string; status?: string }>;
}) {
  const params = await searchParams;
  const routines = await getRoutines(params.search);
  const routines = params.view === "templates"
  ? await getTemplates()
  : await getRoutines(params.search)
  
  // Filtros
  const filteredRoutines = routines.filter((r) => {
    const matchesGoal = !params.goal || r.goal === params.goal;
    const matchesStatus = !params.status || (params.status === "active" ? r.isActive : !r.isActive);
    return matchesGoal && matchesStatus;
  });

  const stats = {
    total: routines.length,
    active: routines.filter((r) => r.isActive).length,
    inactive: routines.filter((r) => !r.isActive).length,
    byGoal: routines.reduce((acc, r) => {
      if (r.goal) acc[r.goal] = (acc[r.goal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell size={24} className="text-blue-600" />
            Rutinas
          </h2>
          <p className="text-slate-500 mt-1">
            {stats.total} rutinas · {stats.active} activas · {stats.inactive} inactivas
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/rutinas/nueva">
            <Button className="gap-2">
              <Plus size={16} /> Nueva rutina
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-blue-600" />
            <span className="text-xs text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-emerald-600" />
            <span className="text-xs text-slate-500">Activas</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-purple-600" />
            <span className="text-xs text-slate-500">Objetivos</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {Object.keys(stats.byGoal).length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-orange-600" />
            <span className="text-xs text-slate-500">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {new Set(routines.map((r) => r.memberId)).size}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-xl p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por nombre o cliente..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          name="goal"
          defaultValue={params.goal || ""}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="">Todos los objetivos</option>
          {Object.entries(goalLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status || ""}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          <Filter size={14} className="mr-1" /> Filtrar
        </Button>
        {(params.search || params.goal || params.status) && (
          <Link href="/admin/rutinas">
            <Button type="button" variant="ghost" size="sm" className="h-9 text-slate-500">
              Limpiar
            </Button>
          </Link>
        )}
      </form>

      {/* Listado */}
      // arriba del listado de rutinas, agregar:
<div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
  <Link href="/admin/rutinas">
    <button className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
      !params.view ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}>
      Rutinas asignadas
    </button>
  </Link>
  <Link href="/admin/rutinas?view=templates">
    <button className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
      params.view === "templates" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50")}>
      <Copy size={14} /> Templates
    </button>
  </Link>
</div>
      {filteredRoutines.length === 0 ? (
        
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
          <Dumbbell className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">No hay rutinas</p>
          <p className="text-sm text-slate-400 mt-1">
            {params.search || params.goal || params.status
              ? "Probá con otros filtros"
              : "Creá la primera rutina para un cliente"}
          </p>
          <Link href="/admin/rutinas/nueva" className="inline-block mt-4">
            <Button size="sm" className="gap-2">
              <Plus size={16} /> Nueva rutina
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRoutines.map((routine) => {
            const totalExercises = routine.days.reduce(
              (sum, d) => sum + d.exercises.length,
              0
            );

            return (
              <div
                key={routine.id}
                className={`bg-white border rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                  routine.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {routine.name}
                      </h3>
                      {routine.goal && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${goalColors[routine.goal] || "bg-slate-50 text-slate-600"}`}
                        >
                          {goalLabels[routine.goal] || routine.goal}
                        </Badge>
                      )}
                      {!routine.isActive && (
                        <Badge className="text-xs bg-slate-100 text-slate-500">
                          Inactiva
                        </Badge>
                      )}
                    </div>

                    {routine.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                        {routine.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {routine.days.length} días · {totalExercises} ejercicios
                      </span>
                      {routine.frequencyPerWeek && (
                        <span className="flex items-center gap-1.5">
                          <Target size={14} className="text-slate-400" />
                          {routine.frequencyPerWeek} días/semana
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" />
                        {routine.member.firstName} {routine.member.lastName}
                      </span>
                    </div>
                  </div>

                  <RoutineActions
                    routineId={routine.id}
                    isActive={routine.isActive}
                    routineName={routine.name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}