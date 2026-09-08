import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { GeneratedDay } from "@/lib/routine-generator";
import { RoutineGoal } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
    days: GeneratedDay[]; // el preview ya editado por el coach
  } = body;

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
      days: {
        create: days.map((day) => ({
          sessionNumber: day.sessionNumber,
          weekNumber: day.weekNumber,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          order: day.order,
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