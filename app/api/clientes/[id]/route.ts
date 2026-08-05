// app/api/clientes/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      photoUrl,
      status,
      emergencyContactName,
      emergencyContactPhone,
      medicalNotes,
      internalNotes,
      // Membresía
      assignMembership,
      planId,
      membershipStartDate,
      membershipEndDate,
    } = body

    // Actualizar datos del member
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        firstName,
        lastName,
        dni,
        email,
        phone,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address: address || null,
        city: city || null,
        photoUrl: photoUrl || null,
        status,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        medicalNotes: medicalNotes || null,
        internalNotes: internalNotes || null,
      },
    })

    // Si hay que asignar/modificar membresía
    if (assignMembership && planId && membershipStartDate && membershipEndDate) {
      // Desactivar membresías anteriores
      await prisma.membership.updateMany({
        where: { memberId: id },
        data: { status: 'EXPIRED' },
      })

      // Crear nueva membresía
      await prisma.membership.create({
        data: {
          memberId: id,
          planId,
          startDate: new Date(membershipStartDate),
          endDate: new Date(membershipEndDate),
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}