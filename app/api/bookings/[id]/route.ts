import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = updateSchema.parse(body)

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { schedule: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    })

    // Descontar sesión de la membresía PT si es una sesión personal (maxCapacity 1)
    // que recién ahora pasa a COMPLETED (evita descontar dos veces)
    if (
      existing.schedule.maxCapacity === 1 &&
      status === 'COMPLETED' &&
      existing.status !== 'COMPLETED'
    ) {
      const activeMembership = await prisma.membership.findFirst({
        where: {
          memberId: existing.memberId,
          status: 'ACTIVE',
          classesRemaining: { gt: 0 },
        },
        orderBy: { endDate: 'desc' },
      })
      if (activeMembership) {
        await prisma.membership.update({
          where: { id: activeMembership.id },
          data: { classesRemaining: { decrement: 1 } },
        })
      }
    }

    return NextResponse.json(booking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.booking.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}