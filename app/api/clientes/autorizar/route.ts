import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { requireOrg } from '@/lib/get-org'

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: 'memberId required' }, { status: 400 })
    }

    // Buscar el member, verificando que sea de esta organización
    const member = await prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
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