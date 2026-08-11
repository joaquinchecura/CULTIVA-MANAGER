import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const attendances = await prisma.attendance.findMany({
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