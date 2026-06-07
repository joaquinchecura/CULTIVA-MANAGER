import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        date: {
          gte: startOfDay(new Date(date)),
          lte: endOfDay(new Date(date)),
        },
        isCancelled: false,
        isHoliday: false,
      },
      include: {
        activity: true,
        bookings: {
          where: { status: 'CONFIRMED' },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Agregar info de cupo disponible
    const schedulesWithAvailability = schedules.map(schedule => ({
      ...schedule,
      availableSpots: schedule.maxCapacity - schedule.bookings.length,
      isFull: schedule.bookings.length >= schedule.maxCapacity,
    }))

    return NextResponse.json(schedulesWithAvailability)
  } catch (error) {
    console.error('Error fetching available classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}