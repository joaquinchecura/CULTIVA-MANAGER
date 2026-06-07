import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'PER_CLASS']),
  pack: z.enum(['GYM_ONLY', 'GYM_CLASSES', 'GYM_CLASSES_TRAINER']),
  price: z.number().positive(),
  durationDays: z.number().int().positive(),
  classesIncluded: z.number().int().min(0),
  description: z.string().optional(),
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
    const validatedData = createPlanSchema.parse(body)

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