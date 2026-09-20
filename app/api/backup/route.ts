import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'
import { toCSV } from '@/lib/csv'
import JSZip from 'jszip'

export async function GET() {
  const { orgId, error } = await requireOrg()
  if (error) return error

  try {
    const where = { organizationId: orgId }

    const [
      members, memberships, plans, payments,
      routines, routineDays, routineExercises,
      sessionLogs, progressLogs,
      attendances, activities, schedules, bookings,
    ] = await Promise.all([
      prisma.member.findMany({ where }),
      prisma.membership.findMany({ where }),
      prisma.plan.findMany({ where }),
      prisma.payment.findMany({ where }),
      prisma.routine.findMany({ where }),
      prisma.routineDay.findMany({ where }),
      prisma.routineExercise.findMany({ where }),
      prisma.sessionLog.findMany({ where }),
      prisma.progressLog.findMany({ where }),
      prisma.attendance.findMany({ where }),
      prisma.activity.findMany({ where }),
      prisma.schedule.findMany({ where }),
      prisma.booking.findMany({ where }),
    ])

    const tables: Record<string, any[]> = {
      clientes: members,
      membresias: memberships,
      planes: plans,
      pagos: payments,
      rutinas: routines,
      rutina_dias: routineDays,
      rutina_ejercicios: routineExercises,
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
    const filename = `backup-${new Date().toISOString().split('T')[0]}.zip`

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