import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireOrg } from '@/lib/get-org'

const createMembershipSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  autoRenew: z.boolean().default(false),
})

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const validatedData = createMembershipSchema.parse(body)

    // Verificar que member y plan sean de esta organización
    const [member, plan] = await Promise.all([
      prisma.member.findFirst({ where: { id: validatedData.memberId, organizationId: orgId }, select: { id: true } }),
      prisma.plan.findFirst({ where: { id: validatedData.planId, organizationId: orgId }, select: { id: true } }),
    ])
    if (!member) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

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
        organizationId: orgId,
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