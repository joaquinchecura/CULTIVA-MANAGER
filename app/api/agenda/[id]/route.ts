import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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