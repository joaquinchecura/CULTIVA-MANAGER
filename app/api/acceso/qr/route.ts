import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function POST() {
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

    // Generar token único
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutos

    // Guardar en attendance como QR pendiente
    await prisma.attendance.create({
      data: {
        memberId: member.id,
        qrToken: token,
        status: 'ALLOWED',
      },
    })

    return NextResponse.json({ token, expiresAt })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}