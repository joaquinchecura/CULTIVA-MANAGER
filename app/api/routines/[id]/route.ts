import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/get-org";

// GET /api/routines/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const { id } = await params;

  const routine = await prisma.routine.findFirst({
    where: { id, organizationId: orgId },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
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

  if (!routine) {
    return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
  }

  return NextResponse.json(routine);
}

// PUT /api/routines/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.routine.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, goal, frequencyPerWeek, isActive, days } = body;

    const routine = await prisma.$transaction(async (tx) => {
      await tx.routine.update({
        where: { id },
        data: {
          name,
          description,
          goal,
          frequencyPerWeek,
          isActive,
        },
      });

      if (days && Array.isArray(days)) {
        await tx.routineDay.deleteMany({ where: { routineId: id } });

        for (const day of days) {
          const newDay = await tx.routineDay.create({
            data: {
              routineId: id,
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
      }

      return tx.routine.findUnique({
        where: { id },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          days: {
            include: {
              exercises: { include: { exercise: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(routine);
  } catch (error) {
    console.error("Error actualizando rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/routines/[id] - Soft delete
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await prisma.routine.updateMany({
      where: { id, organizationId: orgId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error desactivando rutina:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}