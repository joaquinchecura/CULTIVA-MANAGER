import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GeneratedDay } from "@/lib/routine-generator";
import { RoutineGoal } from "@prisma/client";
import { requireOrg } from "@/lib/get-org";

export async function POST(req: NextRequest) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const body = await req.json();
  const {
    memberId,
    name,
    description,
    goal,
    frequencyPerWeek,
    totalWeeks,
    days,
  }: {
    memberId: string;
    name: string;
    description?: string;
    goal: RoutineGoal;
    frequencyPerWeek: number;
    totalWeeks: number;
    days: GeneratedDay[];
  } = body;

  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId: orgId },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const routine = await prisma.routine.create({
    data: {
      memberId,
      name,
      description,
      goal,
      frequencyPerWeek,
      totalWeeks,
      isTemplate: false,
      isActive: true,
      organizationId: orgId,
    },
  });

  for (const day of days) {
    const routineDay = await prisma.routineDay.create({
      data: {
        routineId: routine.id,
        sessionNumber: day.sessionNumber,
        weekNumber: day.weekNumber,
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        order: day.order,
        organizationId: orgId,
      },
    });

    const exerciseRows = day.blocks.flatMap((block) =>
      block.exercises.map((ex) => ({
        dayId: routineDay.id,
        exerciseId: ex.exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        order: ex.order,
        blockId: block.blockId,
        blockLabel: block.label,
        blockType: block.type,
        organizationId: orgId,
      }))
    );

    if (exerciseRows.length) {
      await prisma.routineExercise.createMany({ data: exerciseRows });
    }
  }

  const fullRoutine = await prisma.routine.findUnique({
    where: { id: routine.id },
    include: { days: { include: { exercises: true } } },
  });

  return NextResponse.json(fullRoutine, { status: 201 });
}