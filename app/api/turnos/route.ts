import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBookingSchema = z.object({
  memberId: z.string(),
  scheduleId: z.string(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const scheduleId = searchParams.get('scheduleId')

    if (memberId) {
      // Reservas de un cliente
      const bookings = await prisma.booking.findMany({
        where: { memberId },
        include: {
          schedule: {
            include: {
              activity: true,
            },
          },
        },
        orderBy: { bookingDate: 'desc' },
      })
      return NextResponse.json(bookings)
    }

    if (scheduleId) {
      // Reservas de una clase específica
      const bookings = await prisma.booking.findMany({
        where: { scheduleId, status: 'CONFIRMED' },
        include: {
          member: {
            select: {
              firstName: true,
              lastName: true,
              id: true,
            },
          },
        },
      })
      return NextResponse.json(bookings)
    }

    return NextResponse.json({ error: 'memberId or scheduleId required' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

    // Verificar que la clase existe y tiene cupo
    const schedule = await prisma.schedule.findUnique({
      where: { id: validatedData.scheduleId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
        },
        activity: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (schedule.isCancelled) {
      return NextResponse.json({ error: 'Class is cancelled' }, { status: 400 })
    }

    if (schedule.bookings.length >= schedule.maxCapacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 })
    }

    // Verificar que el cliente no tiene otra reserva en el mismo horario
    const existingBooking = await prisma.booking.findFirst({
      where: {
        memberId: validatedData.memberId,
        scheduleId: validatedData.scheduleId,
        status: { in: ['CONFIRMED'] },
      },
    })

    if (existingBooking) {
      return NextResponse.json({ error: 'Already booked' }, { status: 400 })
    }

    // Verificar membresía activa
    const membership = await prisma.membership.findFirst({
      where: {
        memberId: validatedData.memberId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'No active membership' }, { status: 403 })
    }

    const booking = await prisma.booking.create({
      data: {
        memberId: validatedData.memberId,
        scheduleId: validatedData.scheduleId,
        status: 'CONFIRMED',
      },
      include: {
        schedule: {
          include: {
            activity: true,
          },
        },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ message: 'Booking cancelled' })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}