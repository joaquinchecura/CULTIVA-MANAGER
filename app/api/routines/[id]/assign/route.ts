import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/get-org";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const { id } = await params;
  const { memberId } = await req.json();

  if (!memberId) {
    return NextResponse.json({ error: "memberId requerido" }, { status: 400 });
  }

  try {
    const routine = await prisma.routine.findFirst({
      where: { id, organizationId: orgId },
      include: { days: { include: { exercises: true } } },
    });

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    // Verificar que el cliente destino sea de esta organización
    const member = await prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    await prisma.routine.updateMany({
      where: { memberId, isActive: true, organizationId: orgId },
      data: { isActive: false },
    });

    const assigned = await prisma.routine.create({
      data: {
        memberId,
        name: routine.name,
        description: routine.description,
        goal: routine.goal,
        frequencyPerWeek: routine.frequencyPerWeek,
        isActive: true,
        organizationId: orgId,
        days: {
          create: routine.days.map((day) => ({
            dayName: day.dayName,
            order: day.order,
            sessionNumber: day.sessionNumber ?? 1,
            weekNumber: day.weekNumber ?? 1,
            dayOfWeek: day.dayOfWeek ?? null,
            organizationId: orgId,
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