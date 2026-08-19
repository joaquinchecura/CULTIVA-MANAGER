import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { memberId } = await req.json();

  if (!memberId) {
    return NextResponse.json({ error: "memberId requerido" }, { status: 400 });
  }

  try {
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: { days: { include: { exercises: true } } },
    });

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    // Crear nueva rutina asignada al nuevo cliente
    const assigned = await prisma.routine.create({
      data: {
        memberId,
        name: routine.name,
        description: routine.description,
        goal: routine.goal,
        frequencyPerWeek: routine.frequencyPerWeek,
        isActive: true,
        days: {
          create: routine.days.map((day) => ({
            dayName: day.dayName,
            order: day.order,
            sessionNumber: day.sessionNumber ?? 1,
            weekNumber: day.weekNumber ?? 1,
            dayOfWeek: day.dayOfWeek ?? null,
            exercises: {
              create: day.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest,
                order: ex.order,
                notes: ex.notes,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json(assigned, { status: 201 });
  } catch (error) {
    console.error("Error asignando rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}