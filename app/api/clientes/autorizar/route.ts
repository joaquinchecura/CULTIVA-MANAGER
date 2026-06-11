import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

export async function POST(request: Request) {
  try {
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 })
    }

    // Buscar el member
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (!member.clerkUserId) {
      return NextResponse.json({ error: 'Member not linked to Clerk' }, { status: 400 })
    }

    // 1. Actualizar status a ACTIVE
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { status: 'ACTIVE' },
    })

    // 2. Actualizar metadata en Clerk
    await clerkClient.users.updateUser(member.clerkUserId, {
      publicMetadata: {
        memberId: member.id,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}