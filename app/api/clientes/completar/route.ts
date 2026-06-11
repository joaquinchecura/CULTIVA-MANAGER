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
      clerkUserId 
    } = body

    // Validar campos requeridos
    if (!firstName || !lastName || !dni || !email || !phone || !birthDate || !clerkUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar si ya existe un member con ese DNI o email
    const existing = await prisma.member.findFirst({
      where: {
        OR: [{ dni }, { email }, { clerkUserId }],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'DNI, email or account already exists' }, { status: 400 })
    }

    // Crear el member en la base de datos con status PENDING
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
        status: 'PENDING', // ← Importante: empieza como PENDING
        createdBy: 'self-registration',
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}