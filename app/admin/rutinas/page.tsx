export const dynamic = "force-dynamic";

import { getRoutines } from "@/app/actions/routines";
import { RoutineActions } from "@/components/routines/routine-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dumbbell, Plus, Search, Calendar } from "lucide-react";
import Link from "next/link";

const goalLabels: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia",
  STRENGTH: "Fuerza",
  ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de peso",
  MAINTENANCE: "Mantenimiento",
  REHABILITATION: "Rehabilitación",
};

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const routines = await getRoutines(params.search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">📋 Rutinas</h2>
          <p className="text-slate-500 mt-1">{routines.length} rutina{routines.length !== 1 ? "s" : ""} en total</p>
        </div>
        <Link href="/admin/rutinas/nueva">
          <Button className="gap-2">
            <Plus size={16} /> Nueva rutina
          </Button>
        </Link>
      </div>

      <form className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input
            name="search"
            defaultValue={params.search}
            placeholder="Buscar por nombre o cliente..."
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
      </form>

      {routines.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Dumbbell className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500">No hay rutinas</p>
          <p className="text-sm text-slate-400 mt-1">Creá la primera rutina para un cliente</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              className={`bg-white border-slate-200 hover:border-slate-300 transition-all ${
                !routine.isActive ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{routine.name}</h3>
                      {!routine.isActive && (
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                          Inactiva
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {routine.days.length} días
                      </span>
                      {routine.goal && (
                        <Badge variant="outline" className="text-xs">
                          {goalLabels[routine.goal] || routine.goal}
                        </Badge>
                      )}
                      {routine.frequencyPerWeek && (
                        <span>{routine.frequencyPerWeek} días/semana</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {routine.member.photoUrl ? (
                        <img
                          src={routine.member.photoUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-600 font-medium">
                          {routine.member.firstName[0]}
                        </div>
                      )}
                      <span className="text-sm text-slate-700">
                        {routine.member.firstName} {routine.member.lastName}
                      </span>
                    </div>
                  </div>

                  <RoutineActions routineId={routine.id} isActive={routine.isActive} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}