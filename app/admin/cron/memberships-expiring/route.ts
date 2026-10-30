import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMembershipExpiringEmail } from '@/lib/email'

// Este endpoint se va a llamar automáticamente todos los días a las 9am
// Configurás en vercel.json o en Vercel Cron Jobs
export async function GET(request: Request) {
  try {
    // Verificar el CRON_SECRET (para que nadie más pueda llamar el endpoint)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)

    // Buscar membresías que vencen en exactamente 3 días
    const expiringMemberships = await prisma.membership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(in3Days.setHours(0, 0, 0, 0)),
          lt: new Date(in3Days.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        member: true,
        plan: true,
        organization: {
          include: {
            gymConfigs: true,
          },
        },
      },
    })

    let sent = 0
    for (const membership of expiringMemberships) {
      const gymName = membership.organization?.gymConfigs[0]?.name || 'Tu gimnasio'
      const miplanUrl = process.env.NEXT_PUBLIC_MIPLAN_URL || 'https://miplan.cultivafitness.app'

      const result = await sendMembershipExpiringEmail({
        to: membership.member.email,
        firstName: membership.member.firstName,
        gymName,
        planName: membership.plan.name,
        endDate: membership.endDate,
        daysLeft: 3,
        miplanUrl,
      })

      if (result.success) sent++
    }

    return NextResponse.json({ sent, total: expiringMemberships.length })
  } catch (error) {
    console.error('Error in cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}