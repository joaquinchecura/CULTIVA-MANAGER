export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell, Calendar, Target, Users, ArrowLeft, Edit2,
  Clock, Hash, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const goalLabels: Record<string, string> = {
  HYPERTROPHY: "Hipertrofia",
  STRENGTH: "Fuerza",
  ENDURANCE: "Resistencia",
  WEIGHT_LOSS: "Pérdida de peso",
  MAINTENANCE: "Mantenimiento",
  REHABILITATION: "Rehabilitación",
};

export default async function RutinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      days: {
        orderBy: { sessionNumber: "asc" },  // ← era order: "asc"
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: true },
          },
        },
      },
    },
  });

  if (!routine) return notFound();

  const totalExercises = routine.days.reduce(
    (sum, d) => sum + d.exercises.length,
    0
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/rutinas">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft size={16} /> Volver
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
          <div className="flex items-center gap-3 mb-2">
  <h1 className="text-2xl font-bold text-slate-900">{routine.name}</h1>
  {routine.isTemplate && (
    <Badge className="bg-violet-50 text-violet-700 border-violet-200">Template</Badge>
  )}
  {routine.isActive ? (
    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Activa</Badge>
  ) : (
    <Badge className="bg-slate-100 text-slate-500">Inactiva</Badge>
  )}
</div>
            {routine.description && (
              <p className="text-slate-500 mb-3">{routine.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
            {routine.member && (
  <span className="flex items-center gap-1.5">
    <Users size={14} className="text-slate-400" />
    {routine.member.firstName} {routine.member.lastName}
  </span>
)}
              {routine.goal && (
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-slate-400" />
                  {goalLabels[routine.goal] || routine.goal}
                </span>
              )}
              {routine.frequencyPerWeek && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  {routine.frequencyPerWeek} días/semana
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Dumbbell size={14} className="text-slate-400" />
                {routine.days.length} días · {totalExercises} ejercicios
              </span>
            </div>
          </div>
          <Link href={`/admin/rutinas/${id}/editar`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 size={14} /> Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Días */}
      <div className="space-y-4">
        {routine.days.map((day) => (
          <div key={day.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-blue-600" />
                {day.dayName}
              </h3>
              <span className="text-sm text-slate-500">
                {day.exercises.length} ejercicios
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {day.exercises.map((ex) => (
                <div key={ex.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {ex.order}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{ex.exercise.name}</p>
                      <p className="text-xs text-slate-500">
                        {ex.exercise.type} {ex.exercise.equipment && `· ${ex.exercise.equipment}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Hash size={14} className="text-slate-400" />
                      {ex.sets} series
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={14} className="text-slate-400" />
                      {ex.reps} reps
                    </span>
                    {ex.rest && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {ex.rest}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {day.exercises.length === 0 && (
                <div className="px-5 py-4 text-sm text-slate-400 text-center">
                  Sin ejercicios en este día
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}