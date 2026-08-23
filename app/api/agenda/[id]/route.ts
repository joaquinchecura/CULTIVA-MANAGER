import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        activity: true,
        bookings: {
          include: {
            member: {
              select: { id: true, firstName: true, lastName: true, dni: true, photoUrl: true },
            },
          },
          orderBy: { bookingDate: 'asc' },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Estadística histórica de la actividad: tasa de asistencia promedio
    // sobre las últimas 20 clases finalizadas (excluyendo la actual si aún no pasó)
    const now = new Date()
    const pastSchedules = await prisma.schedule.findMany({
      where: {
        activityId: schedule.activityId,
        isCancelled: false,
        date: { lt: now },
      },
      include: { bookings: true },
      orderBy: { date: 'desc' },
      take: 20,
    })

    let totalBookings = 0
    let totalCompleted = 0
    pastSchedules.forEach(s => {
      const relevant = s.bookings.filter(b => b.status === 'COMPLETED' || b.status === 'NO_SHOW')
      totalBookings += relevant.length
      totalCompleted += s.bookings.filter(b => b.status === 'COMPLETED').length
    })

    const attendanceRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : null

    return NextResponse.json({
      ...schedule,
      activityStats: {
        sampledClasses: pastSchedules.length,
        attendanceRate,
      },
    })
  } catch (error) {
    console.error('Error fetching schedule detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Agregar al final del archivo, después del GET existente

const updateSchema = z.object({
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().optional(),
  maxCapacity: z.number().int().positive().optional(),
  isCancelled: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Agregar al final del archivo, después del PATCH que ya tenés

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.schedule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}