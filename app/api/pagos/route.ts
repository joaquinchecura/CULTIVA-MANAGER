import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    const where = memberId ? { memberId } : {}

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
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        status: 'COMPLETED',
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