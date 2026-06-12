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
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
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

    const member = await prisma.member.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dni: body.dni,
        email: body.email,
        phone: body.phone,
        birthDate: new Date(body.birthDate),
        address: body.address || null,
        city: body.city || null,
        emergencyContactName: body.emergencyContactName || null,
        emergencyContactPhone: body.emergencyContactPhone || null,
        medicalNotes: body.medicalNotes || null,
        internalNotes: body.internalNotes || null,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}