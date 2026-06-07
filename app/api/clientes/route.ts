import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createClientSchema = z.object({
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
    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    const member = await prisma.member.create({
      data: {
        ...validatedData,
        status: 'ACTIVE',
        createdBy: 'admin',
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    // Crear usuario en Clerk con metadata
    // Nota: Esto requiere la API de Clerk, lo hacemos después
    // Por ahora, el admin debe actualizar manualmente el metadata en Clerk
  }
}