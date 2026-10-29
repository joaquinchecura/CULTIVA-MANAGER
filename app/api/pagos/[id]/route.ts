import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOrg } from '@/lib/get-org'
import { z } from 'zod'

const updateSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  method: z.enum(['CASH', 'TRANSFER', 'MERCADOPAGO', 'CARD', 'OTHER']).optional(),
  concept: z.string().min(1).optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error
    const { id } = await params

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Verificar que el pago sea de esta organización
    const existing = await prisma.payment.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount: data.amount,
        method: data.method,
        concept: data.concept,
        reference: data.reference,
        notes: data.notes,
      },
    })

    return NextResponse.json(payment)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('Error updating payment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, error } = await requireOrg()
    if (error) return error
    const { id } = await params

    // Verificar que el pago sea de esta organización
    const existing = await prisma.payment.findFirst({
      where: { id, organizationId: orgId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    await prisma.payment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting payment:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}