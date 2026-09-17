import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePlatformAdmin } from '@/lib/get-org'

export async function GET() {
  const { error } = await requirePlatformAdmin()
  if (error) return error

  try {
    const [
      members, memberships, plans, payments,
      routines, routineDays, routineExercises,
      exercises, sessionLogs, progressLogs,
      attendances, activities, schedules, bookings,
    ] = await Promise.all([
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

    const backup = {
      generatedAt: new Date().toISOString(),
      counts: {
        members: members.length,
        memberships: memberships.length,
        payments: payments.length,
        routines: routines.length,
        exercises: exercises.length,
      },
      data: {
        members, memberships, plans, payments,
        routines, routineDays, routineExercises,
        exercises, sessionLogs, progressLogs,
        attendances, activities, schedules, bookings,
      },
    }

    const filename = `cultiva-backup-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Error generando backup' }, { status: 500 })
  }
}