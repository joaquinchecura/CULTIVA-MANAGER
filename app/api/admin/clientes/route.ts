import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/clientes
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (id) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { memberships: { include: { plan: true } } },
    })
    return NextResponse.json(member)
  }

  const members = await prisma.member.findMany({
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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const member = await prisma.member.create({
      data: {
        ...body,
        status: 'ACTIVE',
        createdBy: userId,
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
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    await prisma.member.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error deleting member' }, { status: 500 })
  }
}