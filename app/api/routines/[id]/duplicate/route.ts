import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const original = await prisma.routine.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            exercises: true,
          },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    const duplicate = await prisma.$transaction(async (tx) => {
      const newRoutine = await tx.routine.create({
        data: {
          memberId: original.memberId,
          name: `${original.name} (copia)`,
          description: original.description,
          goal: original.goal,
          frequencyPerWeek: original.frequencyPerWeek,
          isActive: false,
        },
      });

      for (const day of original.days) {
        const newDay = await tx.routineDay.create({
          data: {
            routineId: newRoutine.id,
            dayName: day.dayName,
            order: day.order,
            sessionNumber: day.sessionNumber ?? 1,
            weekNumber: day.weekNumber ?? 1,
            dayOfWeek: day.dayOfWeek ?? null,
          },
        });

        for (const ex of day.exercises) {
          await tx.routineExercise.create({
            data: {
              dayId: newDay.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              order: ex.order,
              notes: ex.notes,
            },
          });
        }
      }

      return newRoutine;
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error("Error duplicando rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}