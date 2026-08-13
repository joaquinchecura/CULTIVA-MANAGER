import { prisma } from "@/lib/prisma";
import { RoutineBuilder } from "@/components/routines/routine-builder";
import { notFound } from "next/navigation";
import { mapPrismaExercise } from "@/types/exercise";

export default async function EditarRutinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { order: "asc" },
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

  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  // ✅ MAPEAMOS los datos de Prisma para que exercise use undefined en vez de null
  const mappedRoutine = {
    ...routine,
    days: routine.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        exercise: mapPrismaExercise(ex.exercise),
      })),
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">✏️ Editar rutina</h2>
        <p className="text-slate-500 mt-1">Modificá la rutina de {routine.name}</p>
      </div>
      <RoutineBuilder members={members} initialData={mappedRoutine} />
    </div>
  );
}