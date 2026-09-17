import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      dni,
      email,
      phone,
      birthDate,
      address,
      city,
      emergencyContactName,
      emergencyContactPhone,
      clerkUserId,
      organizationId,
    } = body

    if (!firstName || !lastName || !dni || !email || !phone || !birthDate || !clerkUserId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar que la organización exista (evita que alguien mande un id inventado)
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (!org) {
      return NextResponse.json({ error: 'Organización inválida' }, { status: 400 })
    }

    const existing = await prisma.member.findFirst({
      where: {
        OR: [{ dni }, { email }, { clerkUserId }],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'DNI, email or account already exists' }, { status: 400 })
    }

    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        dni,
        email,
        phone,
        birthDate: new Date(birthDate),
        address: address || null,
        city: city || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        clerkUserId,
        status: 'PENDING',
        createdBy: 'self-registration',
        organizationId,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}