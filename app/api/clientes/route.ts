import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { clerkClient } from '@clerk/clerk-sdk-node'

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
    const members = await prisma.member.findMany({
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
    const body = await request.json()
    const validatedData = createMemberSchema.parse(body)

    // 1. Crear usuario en Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [validatedData.email],
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      password: validatedData.dni, // Usamos el DNI como password inicial
      publicMetadata: {
        memberId: '', // Lo actualizamos después
      },
    })

    // 2. Crear member en la base de datos con el clerkUserId
    const member = await prisma.member.create({
      data: {
        ...validatedData,
        clerkUserId: clerkUser.id,
        status: 'ACTIVE',
        createdBy: 'admin',
      },
    })

    // 3. Actualizar el metadata de Clerk con el memberId
    await clerkClient.users.updateUser(clerkUser.id, {
      publicMetadata: {
        memberId: member.id,
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    // Buscar el member para obtener el clerkUserId
    const member = await prisma.member.findUnique({
      where: { id },
    })

    if (member?.clerkUserId) {
      // Eliminar usuario de Clerk
      await clerkClient.users.deleteUser(member.clerkUserId)
    }

    // Eliminar de la base de datos
    await prisma.member.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Member deleted' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}