import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

// GET /api/admin/clientes
export async function GET(req: NextRequest) {
  const { orgId, error } = await requireOrg()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const member = await prisma.member.findFirst({
      where: { id, organizationId: orgId },
      include: { memberships: { include: { plan: true } } },
    })
    return NextResponse.json(member)
  }

  const members = await prisma.member.findMany({
    where: { organizationId: orgId },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(members)
}

// POST /api/admin/clientes
export async function POST(req: NextRequest) {
  const { userId, orgId, error } = await requireOrg()
  if (error) return error

  try {
    const body = await req.json()
    const member = await prisma.member.create({
      data: {
        ...body,
        status: 'ACTIVE',
        createdBy: userId,
        organizationId: orgId,
      },
    })
    return NextResponse.json(member)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error creating member' }, { status: 500 })
  }
}

// DELETE /api/admin/clientes?id=xxx
export async function DELETE(req: NextRequest) {
  const { orgId, error } = await requireOrg()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const result = await prisma.member.deleteMany({ where: { id, organizationId: orgId } })
    if (result.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error deleting member' }, { status: 500 })
  }
}