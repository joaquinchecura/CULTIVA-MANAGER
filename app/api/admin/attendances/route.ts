import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { orgId, error } = await requireOrg()
  if (error) return error

  const attendances = await prisma.attendance.findMany({
    where: { organizationId: orgId },
    orderBy: { entryTime: 'desc' },
    take: 500, // Últimas 500 asistencias
    include: {
      member: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dni: true,
        },
      },
    },
  })

  return NextResponse.json(attendances)
}