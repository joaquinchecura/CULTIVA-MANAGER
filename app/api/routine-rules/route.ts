import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rules = await prisma.routineRule.findMany({ orderBy: [{ goal: "asc" }, { exerciseType: "asc" }] });
  return NextResponse.json(rules);
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json(); // { id, sets, repsMin, repsMax, durationSec, restSeconds }
  const updated = await prisma.routineRule.update({
    where: { id: body.id },
    data: {
      sets: body.sets,
      repsMin: body.repsMin,
      repsMax: body.repsMax,
      durationSec: body.durationSec,
      restSeconds: body.restSeconds,
    },
  });
  return NextResponse.json(updated);
}