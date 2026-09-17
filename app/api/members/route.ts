import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/get-org";

export async function GET(req: NextRequest) {
  const { userId, orgId, error } = await requireOrg();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const where: any = { organizationId: orgId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { dni: { contains: search, mode: "insensitive" } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    select: {
      id: true, firstName: true, lastName: true, email: true, dni: true, status: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json(members);
}