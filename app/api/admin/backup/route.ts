import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin } from '@/lib/get-org'
import { toCSV } from '@/lib/csv'
import JSZip from 'jszip'

export async function GET() {
  const { error } = await requirePlatformAdmin()
  if (error) return error

  try {
    const [
      organizations, members, memberships, plans, payments,
      routines, routineDays, routineExercises,
      exercises, sessionLogs, progressLogs,
      attendances, activities, schedules, bookings,
    ] = await Promise.all([
      prisma.organization.findMany(),
      prisma.member.findMany(),
      prisma.membership.findMany(),
      prisma.plan.findMany(),
      prisma.payment.findMany(),
      prisma.routine.findMany(),
      prisma.routineDay.findMany(),
      prisma.routineExercise.findMany(),
      prisma.exercise.findMany(),
      prisma.sessionLog.findMany(),
      prisma.progressLog.findMany(),
      prisma.attendance.findMany(),
      prisma.activity.findMany(),
      prisma.schedule.findMany(),
      prisma.booking.findMany(),
    ])

    const tables: Record<string, any[]> = {
      organizaciones: organizations,
      clientes: members,
      membresias: memberships,
      planes: plans,
      pagos: payments,
      rutinas: routines,
      rutina_dias: routineDays,
      rutina_ejercicios: routineExercises,
      ejercicios: exercises,
      sesiones: sessionLogs,
      progreso: progressLogs,
      asistencias: attendances,
      actividades: activities,
      agenda: schedules,
      reservas: bookings,
    }

    const zip = new JSZip()
    for (const [name, rows] of Object.entries(tables)) {
      zip.file(`${name}.csv`, toCSV(rows))
    }

    const buffer = await zip.generateAsync({ type: 'uint8array' })
    const filename = `backup-plataforma-${new Date().toISOString().split('T')[0]}.zip`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Error generando backup' }, { status: 500 })
  }
}