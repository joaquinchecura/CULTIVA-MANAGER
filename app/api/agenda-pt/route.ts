import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'
import { z } from 'zod'
import { addDays, format, getDay } from 'date-fns'

const createSchema = z.object({
  memberId: z.string(),
  activityId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  isRecurring: z.boolean().default(false),
  selectedDays: z.array(z.number()).default([]),
  totalClasses: z.number().default(1),
})

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const data = createSchema.parse(body)

    // Verificar que el cliente sea de la org
    const member = await prisma.member.findFirst({
      where: { id: data.memberId, organizationId: orgId },
      select: { id: true },
    })
    if (!member) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Verificar que la actividad sea de la org
    const activity = await prisma.activity.findFirst({
      where: { id: data.activityId, organizationId: orgId },
      select: { id: true },
    })
    if (!activity) return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })

    // Si NO es recurrente, creamos 1 sola sesión
    if (!data.isRecurring) {
      const schedule = await prisma.schedule.create({
        data: {
          activityId: data.activityId,
          date: new Date(data.date),
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room || null,
          maxCapacity: 1,
          organizationId: orgId,
        },
      })

      // Creamos la reserva asociada
      await prisma.booking.create({
        data: {
          memberId: data.memberId,
          scheduleId: schedule.id,
          status: 'CONFIRMED',
          organizationId: orgId,
        },
      })

      return NextResponse.json({ success: true, created: 1 })
    }

    // Si ES recurrente, calculamos las fechas
    const startDate = new Date(data.date + 'T12:00:00')
    const daysOfWeek = data.selectedDays // [1, 3] por ejemplo (Lunes y Miércoles)
    
    // Generamos las fechas
    const dates: Date[] = []
    let currentDate = startDate
    let safetyCounter = 0 // Para no loopear infinito

    while (dates.length < data.totalClasses && safetyCounter < 365) {
      const dayOfWeek = getDay(currentDate) // 0 = Domingo, 1 = Lunes...
      if (daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(currentDate))
      }
      currentDate = addDays(currentDate, 1)
      safetyCounter++
    }

    if (dates.length < data.totalClasses) {
      return NextResponse.json(
        { error: 'No se pudieron generar todas las fechas. Verificá los días seleccionados.' },
        { status: 400 }
      )
    }

    // Creamos todas las sesiones con un bucle
    let created = 0
    for (const date of dates) {
      // Verificar que no exista ya una sesión para ese horario
      const existing = await prisma.schedule.findFirst({
        where: {
          organizationId: orgId,
          activityId: data.activityId,
          date: date,
          startTime: data.startTime,
        },
      })

      if (existing) continue // Si ya existe, la salteamos

      const schedule = await prisma.schedule.create({
        data: {
          activityId: data.activityId,
          date,
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room || null,
          maxCapacity: 1,
          organizationId: orgId,
        },
      })

      await prisma.booking.create({
        data: {
          memberId: data.memberId,
          scheduleId: schedule.id,
          status: 'CONFIRMED',
          organizationId: orgId,
        },
      })

      created++
    }

    return NextResponse.json({ success: true, created })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 