import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoutinePreview, SplitDay, ExperienceLevel } from "@/lib/routine-generator";
import { RoutineGoal } from "@prisma/client";
import { requireOrg } from "@/lib/get-org";

export async function POST(req: NextRequest) {
  const { orgId, error } = await requireOrg();
  if (error) return error;

  const body = await req.json();
  const {
    goal,
    frequencyPerWeek,
    totalWeeks,
    sameEachWeek,
    splitDays,
    availableEquipment,
    experienceLevel,
    avoidMuscleGroups,
    prioritizeCompound,
  }: {
    goal: RoutineGoal;
    frequencyPerWeek: number;
    totalWeeks: number;
    sameEachWeek: boolean;
    splitDays: SplitDay[];
    availableEquipment: string[] | null;
    experienceLevel?: ExperienceLevel;
    avoidMuscleGroups?: string[];
    prioritizeCompound?: boolean;
  } = body;

  const [exercises, rules] = await Promise.all([
    prisma.exercise.findMany({
      where: {
        isPublic: true,
        OR: [{ organizationId: orgId }, { organizationId: null }],
      },
    }),
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
      experienceLevel,
      avoidMuscleGroups,
      prioritizeCompound,
    });
    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}