import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireOrg } from '@/lib/get-org'

const createMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  birthDate: z.string().transform((str) => new Date(str)),
  address: z.string().optional(),
  city: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalNotes: z.string().optional(),
  internalNotes: z.string().optional(),
})

export async function GET() {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const members = await prisma.member.findMany({
      where: { organizationId: orgId },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const validatedData = createMemberSchema.parse(body)

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        status: 'ACTIVE',
        createdBy: 'admin',
        organizationId: orgId,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const result = await prisma.member.deleteMany({
      where: { id, organizationId: orgId },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Member deleted' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}