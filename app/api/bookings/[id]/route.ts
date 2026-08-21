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

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    })

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