import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMembershipSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  autoRenew: z.boolean().default(false),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createMembershipSchema.parse(body)

    // Desactivar membresías anteriores del mismo cliente
    await prisma.membership.updateMany({
      where: { memberId: validatedData.memberId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    })

    const membership = await prisma.membership.create({
      data: {
        memberId: validatedData.memberId,
        planId: validatedData.planId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        autoRenew: validatedData.autoRenew,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating membership:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}