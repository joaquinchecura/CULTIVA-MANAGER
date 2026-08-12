import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  defaultDuration: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// FIX: params es Promise<{ id: string }> en Next.js 15
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)
    
    const activity = await prisma.activity.update({
      where: { id },
      data,
    })
    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error updating activity' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    const activity = await prisma.activity.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(activity)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating activity' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.activity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting activity' }, { status: 500 })
  }
}