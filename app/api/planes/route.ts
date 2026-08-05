import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const planSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'PER_CLASS']),
  pack: z.enum(['GYM_ONLY', 'CLASSES_ONLY', 'GYM_CLASSES', 'PERSONAL_TRAINER', 'FULL']),
  price: z.number().positive(),
  durationDays: z.number().int().positive(),
  classesIncluded: z.number().int().min(0),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = planSchema.parse(body)

    const plan = await prisma.plan.create({
      data: {
        ...validatedData,
        isActive: true,
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = planSchema.partial().parse(body)

    const plan = await prisma.plan.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(plan)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar si hay membresías activas con este plan
    const activeMemberships = await prisma.membership.count({
      where: { planId: id, status: 'ACTIVE' },
    })

    if (activeMemberships > 0) {
      // En vez de borrar, desactivar
      await prisma.plan.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({ 
        success: true, 
        message: 'Plan desactivado (tiene membresías activas)' 
      })
    }

    await prisma.plan.delete({ where: { id } })

    return NextResponse.json({ 
      success: true, 
      message: 'Plan eliminado' 
    })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}