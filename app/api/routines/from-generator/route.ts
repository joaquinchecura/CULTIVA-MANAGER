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

  // Verificar que el cliente sea de esta organización
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
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
          organizationId: orgId,
          exercises: {
            create: day.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              order: ex.order,
            })),
          },
        })),
      },
    },
    include: { days: { include: { exercises: true } } },
  });

  return NextResponse.json(routine, { status: 201 });
}