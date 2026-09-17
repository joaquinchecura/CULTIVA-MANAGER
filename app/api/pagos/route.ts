import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireOrg } from '@/lib/get-org'

const createPaymentSchema = z.object({
  memberId: z.string(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER', 'MERCADOPAGO', 'CARD', 'OTHER']),
  concept: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    const where: any = { organizationId: orgId }
    if (memberId) where.memberId = memberId

    const payments = await prisma.payment.findMany({
      where,
      include: { member: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Verificar que el cliente sea de esta organización
    const member = await prisma.member.findFirst({
      where: { id: validatedData.memberId, organizationId: orgId },
      select: { id: true },
    })
    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        status: 'COMPLETED',
        organizationId: orgId,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}