import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { memberId, activityId, date, startTime, endTime, room } = await request.json()

    if (!memberId || !activityId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que member y activity sean de esta organización
    const [member, activity] = await Promise.all([
      prisma.member.findFirst({ where: { id: memberId, organizationId: orgId }, select: { id: true } }),
      prisma.activity.findFirst({ where: { id: activityId, organizationId: orgId }, select: { id: true } }),
    ])
    if (!member) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    if (!activity) return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })

    // Crear schedule personalizada (cupo = 1)
    const schedule = await prisma.schedule.create({
      data: {
        activityId,
        date: new Date(date),
        startTime,
        endTime,
        room: room || null,
        maxCapacity: 1,
        organizationId: orgId,
      },
    })

    // Crear booking confirmado para el cliente
    const booking = await prisma.booking.create({
      data: {
        memberId,
        scheduleId: schedule.id,
        status: 'CONFIRMED',
        organizationId: orgId,
      },
    })

    return NextResponse.json({ success: true, schedule, booking })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}