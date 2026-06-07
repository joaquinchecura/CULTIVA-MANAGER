import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const member = await prisma.member.findFirst({
      where: { clerkUserId: userId },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const nextBooking = await prisma.booking.findFirst({
      where: {
        memberId: member.id,
        status: 'CONFIRMED',
        schedule: {
          date: { gte: new Date() },
        },
      },
      include: {
        schedule: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: {
        schedule: {
          date: 'asc',
        },
      },
    })

    if (!nextBooking) {
      return NextResponse.json(null)
    }

    return NextResponse.json(nextBooking)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}