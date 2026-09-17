import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export async function GET() {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const members = await prisma.member.findMany({
      where: { status: 'PENDING', organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}