import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireOrg } from '@/lib/get-org'

const updateSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { status } = updateSchema.parse(body)

    const existing = await prisma.booking.findFirst({
      where: { id, organizationId: orgId },
      include: { schedule: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    })

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
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { id } = await params

    const result = await prisma.booking.deleteMany({ where: { id, organizationId: orgId } })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}