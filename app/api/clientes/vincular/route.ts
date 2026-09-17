import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'
import { requireOrg } from '@/lib/get-org'

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { memberId, clerkUserId } = await request.json()

    if (!memberId || !clerkUserId) {
      return NextResponse.json({ error: 'memberId and clerkUserId required' }, { status: 400 })
    }

    // Verificar que el member sea de esta organización antes de vincularlo
    const existing = await prisma.member.findFirst({
      where: { id: memberId, organizationId: orgId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
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