import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { requireOrg } from '@/lib/get-org'

const createScheduleSchema = z.object({
  activityId: z.string(),
  date: z.string().transform((str) => new Date(str)),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  maxCapacity: z.number().int().positive(),
})

export async function GET(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date')

    let where: any = { isHoliday: false, organizationId: orgId }

    if (date) {
      const d = parseISO(date)
      where.date = { gte: startOfDay(d), lte: endOfDay(d) }
    } else if (startDate && endDate) {
      const start = parseISO(startDate)
      const end = parseISO(endDate)
      where.date = { gte: startOfDay(start), lte: endOfDay(end) }
    } else {
      return NextResponse.json({ error: 'Date or date range is required' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        ...where,
        activity: { type: 'GROUP' },
      },
      include: { activity: true, bookings: true },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Verificar que la actividad sea de esta organización
    const activity = await prisma.activity.findFirst({
      where: { id: validatedData.activityId, organizationId: orgId },
      select: { id: true },
    })
    if (!activity) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
    }

    const schedule = await prisma.schedule.create({
      data: { ...validatedData, organizationId: orgId },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}