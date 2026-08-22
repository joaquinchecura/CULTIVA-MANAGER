import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  memberId: z.string(),
  activityId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
})

export async function POST(request: Request) {
    try {
      const body = await request.json()
      const data = createSchema.parse(body)
  
      const schedule = await prisma.schedule.create({
        data: {
          activityId: data.activityId,
          date: new Date(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room,
          maxCapacity: 1,
          bookings: {
            create: {
              memberId: data.memberId,
              status: 'CONFIRMED',
            },
          },
        },
        include: {
          activity: true,
          bookings: true,
        },
      })
  
      return NextResponse.json(schedule, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 })
      }
      console.error('Error creating PT session:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate y endDate requeridos' }, { status: 400 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        maxCapacity: 1,
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      include: {
        activity: true,
        bookings: {
          include: {
            member: {
              select: {
                id: true, firstName: true, lastName: true, dni: true,
                memberships: {
                  where: { status: 'ACTIVE', endDate: { gte: new Date() } },
                  include: { plan: true },
                  orderBy: { endDate: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Error fetching PT schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}