import { prisma } from '@/lib/prisma'

export async function getSessionLabel(memberId: string, scheduleDate: Date) {
  const membership = await prisma.membership.findFirst({
    where: {
      memberId,
      status: 'ACTIVE',
      classesRemaining: { not: null },
    },
    include: { plan: true },
    orderBy: { endDate: 'desc' },
  })

  if (!membership) return null

  // Todas las sesiones PT (no canceladas) del cliente dentro del rango de esta membresía
  const sessions = await prisma.booking.findMany({
    where: {
      memberId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      schedule: {
        maxCapacity: 1,
        date: { gte: membership.startDate, lte: membership.endDate },
      },
    },
    include: { schedule: true },
    orderBy: { schedule: { date: 'asc' } },
  })

  const position = sessions.findIndex(
    s => s.schedule.date.getTime() === scheduleDate.getTime()
  )

  const total = membership.plan.classesIncluded || sessions.length
  const current = position >= 0 ? position + 1 : sessions.length + 1

  return { current, total, remaining: membership.classesRemaining ?? 0, planName: membership.plan.name }
}