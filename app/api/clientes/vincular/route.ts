import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(request: Request) {
  try {
    const { memberId, clerkUserId } = await request.json()

    if (!memberId || !clerkUserId) {
      return NextResponse.json({ error: 'memberId and clerkUserId required' }, { status: 400 })
    }

    // 1. Actualizar member en la base de datos
    const member = await prisma.member.update({
      where: { id: memberId },
      data: { clerkUserId },
    })

    // 2. Actualizar metadata en Clerk
    await clerkClient.users.updateUser(clerkUserId, {
      publicMetadata: {
        memberId: member.id,
      },
    })

    return NextResponse.json({ success: true, member })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}