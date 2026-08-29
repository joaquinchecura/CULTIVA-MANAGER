import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['GROUP', 'PERSONAL']).optional(),
  defaultDuration: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        maxCapacity: data.type === 'PERSONAL' ? 1 : data.maxCapacity,
      },
    })
    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error updating activity' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const activity = await prisma.activity.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(activity)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating activity' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    // P2003: violación de restricción de clave foránea — la actividad tiene
    // Schedules (clases programadas) asociados, así que no se puede borrar
    // sin borrar antes esas clases (o cancelarlas/archivar la actividad).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar: esta actividad tiene clases programadas asociadas. Cancelá o eliminá esas clases primero, o marcá la actividad como inactiva en su lugar.' },
        { status: 409 }
      )
    }
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Error deleting activity' }, { status: 500 })
  }
}