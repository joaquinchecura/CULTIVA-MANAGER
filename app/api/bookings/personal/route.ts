import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, activityId, date, startTime, endTime, room } = await request.json()

    if (!memberId || !activityId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Verificar que el member existe
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })
    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Crear schedule personalizada (cupo = 1)
    const schedule = await prisma.schedule.create({
      data: {
        activityId,
        date: new Date(date),
        startTime,
        endTime,
        room: room || null,
        maxCapacity: 1,
      },
    })

    // Crear booking confirmado para el cliente
    const booking = await prisma.booking.create({
      data: {
        memberId,
        scheduleId: schedule.id,
        status: 'CONFIRMED',
      },
    })

    return NextResponse.json({ success: true, schedule, booking })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}