import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createActivitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['GROUP', 'PERSONAL']),
  defaultDuration: z.number().int().positive(),
  maxCapacity: z.number().int().positive(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const activities = await prisma.activity.findMany({
      where: type ? { type: type as 'GROUP' | 'PERSONAL' } : undefined,
      include: {
        _count: { select: { schedules: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createActivitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        maxCapacity: validatedData.type === 'PERSONAL' ? 1 : validatedData.maxCapacity,
        isActive: true,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}