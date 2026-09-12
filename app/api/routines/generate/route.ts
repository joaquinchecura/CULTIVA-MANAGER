import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateRoutinePreview, SplitDay } from "@/lib/routine-generator";
import { RoutineGoal } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    goal,
    frequencyPerWeek,
    totalWeeks,
    sameEachWeek,
    splitDays,
    availableEquipment,
  }: {
    goal: RoutineGoal;
    frequencyPerWeek: number;
    totalWeeks: number;
    sameEachWeek: boolean;
    splitDays: SplitDay[];
    availableEquipment: string[] | null;
  } = body;

  const [exercises, rules] = await Promise.all([
    prisma.exercise.findMany({ where: { isPublic: true } }),
    prisma.routineRule.findMany(),
  ]);

  try {
    const preview = generateRoutinePreview({
      goal,
      frequencyPerWeek,
      totalWeeks,
      sameEachWeek,
      splitDays,
      availableEquipment: availableEquipment && availableEquipment.length ? availableEquipment : null,
      exercises,
      rules,
    });
    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}