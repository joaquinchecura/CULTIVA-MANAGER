import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/get-org";

export async function GET(req: NextRequest) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const isActive = searchParams.get("isActive");

  const where: any = { organizationId: orgId };
  if (memberId) where.memberId = memberId;
  if (isActive !== null) where.isActive = isActive === "true";

  const routines = await prisma.routine.findMany({
    where,
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true } },
      days: { include: { exercises: { include: { exercise: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(routines);
}

export async function POST(req: NextRequest) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  try {
    const body = await req.json();
    const { memberId, name, description, goal, frequencyPerWeek, days } = body;

    if (!memberId || !name || !days || !Array.isArray(days)) {
      return NextResponse.json({ error: "memberId, name y days son obligatorios" }, { status: 400 });
    }

    const routine = await prisma.$transaction(async (tx) => {
      const newRoutine = await tx.routine.create({
        data: {
          memberId, name, description, goal, frequencyPerWeek,
          isActive: true,
          organizationId: orgId,
        },
      });

      for (const day of days) {
        const newDay = await tx.routineDay.create({
          data: {
            routineId: newRoutine.id,
            dayName: day.dayName,
            order: day.order,
            sessionNumber: day.sessionNumber ?? 1,
            weekNumber: day.weekNumber ?? 1,
            dayOfWeek: day.dayOfWeek ?? null,
            organizationId: orgId,
          },
        });

        if (day.exercises && Array.isArray(day.exercises)) {
          for (const ex of day.exercises) {
            await tx.routineExercise.create({
              data: {
                dayId: newDay.id,
                exerciseId: ex.exerciseId,
                sets: ex.sets || 3,
                reps: ex.reps || "10",
                rest: ex.rest || "60s",
                order: ex.order,
                notes: ex.notes,
              },
            });
          }
        }
      }

      return tx.routine.findUnique({
        where: { id: newRoutine.id },
        include: { days: { include: { exercises: { include: { exercise: true } } } } },
      });
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error("Error creando rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}